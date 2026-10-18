import test from 'node:test';
import assert from 'node:assert/strict';
import { processApplicant, processAdmissions } from './admissions.js';
import { calculateGrade } from './gradeUtils.js';
import { analyzeResults } from './analytics.js';
import { updateProfile, compareReferences } from './profiles.js';
import { processTranscripts } from './transcriptService.js';
import { LegacyRegistration, PromiseRegistration, selectCourseServer } from './registration.js';
import { getJSON, fakeFetch, loadDashboard, fetchWithTimeout, HTTPError, TimeoutError } from './api.js';

test('admissions validate boundaries, conversions, statuses and empty summary', () => {
  const base = { id: 'A1', name: 'Ali', age: '17', matricMarks: '70', intermediateMarks: '70', entryTest: '70', program: 'BSCS', feePaid: 'false' };
  assert.equal(processApplicant(base).status, 'WAITING');
  assert.equal(processApplicant({ ...base, feePaid: 'true', age: 30 }).status, 'SELECTED');
  assert.equal(processApplicant({ ...base, entryTest: 59 }).status, 'REJECTED');
  for (const patch of [{ age: 31 }, { matricMarks: 101 }, { intermediateMarks: '' }, { age: true }, { program: 'XX' }, { feePaid: 'yes' }]) assert.equal(processApplicant({ ...base, ...patch }).status, 'INVALID DATA');
  assert.equal(base.age, '17');
  assert.equal(processAdmissions([]).summary.averageMerit, null);
});
test('grade bands and invalid marks', () => {
  for (const [mark, grade] of [[0, 'F'], [49, 'F'], [50, 'C'], [60, 'C+'], [65, 'B-'], [70, 'B'], [75, 'B+'], [80, 'A-'], [85, 'A'], [100, 'A']]) assert.equal(calculateGrade(mark).grade, grade);
  for (const mark of [-1, 101, NaN, '82']) assert.throws(() => calculateGrade(mark));
});
test('analytics preserves input and supports new departments and ties', () => {
  const rows = [{ name: 'Zoya', department: 'DS', marks: 91 }, { name: 'Ali', department: 'DS', marks: 91 }];
  const snapshot = structuredClone(rows);
  assert.deepEqual(analyzeResults(rows).queries.topThreeNames, ['Ali', 'Zoya']);
  assert.equal(analyzeResults(rows).departments.DS.average, 91);
  assert.deepEqual(rows, snapshot);
  assert.equal(analyzeResults([]).average, null);
  assert.throws(() => analyzeResults([{ name: 'Ali', department: 'CS', marks: 101 }]));
});
test('profile preserves falsy fields and nested data with new references', () => {
  const original = { name: 'Ali', marks: 0, scholarship: false, address: { city: 'Islamabad', sector: 'F-10' }, contact: { email: 'a@b.com' } };
  const updated = updateProfile(original, { name: '', address: { city: 'Rawalpindi' }, contact: { phone: '' } });
  assert.equal(updated.address.sector, 'F-10');
  assert.equal(original.address.city, 'Islamabad');
  assert.equal(updated.name, '');
  assert.equal(updated.marks, 0);
  assert.equal(updated.scholarship, false);
  assert.deepEqual(compareReferences(original, updated), { sameObject: false, sameAddress: false, sameContact: false });
  assert.throws(() => updateProfile(original, { address: null }));
});
test('transcript report roundtrip and rejection cases', () => {
  const row = { id: 101, name: 'Ali', courses: [{ code: 'CS301', marks: 80 }] };
  const output = processTranscripts(JSON.stringify([row]));
  assert.deepEqual(JSON.parse(output.json), output.report);
  assert.equal(output.report.students[0].gpa, 3.67);
  assert.throws(() => processTranscripts('{'), SyntaxError);
  for (const rows of [[{ ...row, id: null }], [row, row], [{ ...row, courses: [{ marks: 80 }] }], [{ ...row, courses: [{ code: 'X', marks: -1 }] }]]) assert.throws(() => processTranscripts(JSON.stringify(rows)));
});
test('legacy callbacks stop on failures and complete once', (t, done) => {
  const service = new LegacyRegistration();
  const cases = [[999, 'CS401', 'Student does not exist'], [102, 'CS401', 'Prerequisite not completed'], [101, 'FULL', 'Course is full'], [101, 'CS401', null], [101, 'CS401', 'Student already registered']];
  let index = 0;
  let calls = 0;
  function next() {
    if (index === cases.length) {
      setTimeout(() => { assert.equal(calls, cases.length); done(); }, 20);
      return;
    }
    const [id, code, expected] = cases[index++];
    service.register(id, code, (error, value) => {
      calls += 1;
      assert.equal(error?.message ?? null, expected);
      if (!error) assert.equal(value.status, 'REGISTERED');
      next();
    });
  }
  next();
});
test('Promise registration reports partial notification failure and propagates errors', async () => {
  const service = new PromiseRegistration();
  const result = await service.register(101, 'CS401');
  assert.deepEqual(result.services.map(row => row.status), ['fulfilled', 'rejected', 'fulfilled']);
  for (const [id, code] of [[999, 'CS401'], [102, 'CS401'], [101, 'FULL'], [101, 'CS401']]) await assert.rejects(service.register(id, code));
  assert.equal(service.completedWorkflows, 5);
  assert.equal(await selectCourseServer([() => Promise.reject(new Error('offline')), () => Promise.resolve('online')]), 'online');
  await assert.rejects(selectCourseServer([() => Promise.reject(new Error('offline'))]), AggregateError);
});
test('API success, HTTP, network, JSON and timeout failures', async () => {
  assert.equal((await loadDashboard()).totalStudents, 2);
  await assert.rejects(getJSON('/404', fakeFetch), HTTPError);
  await assert.rejects(getJSON('/500', fakeFetch), HTTPError);
  await assert.rejects(getJSON('/network-error', fakeFetch), TypeError);
  await assert.rejects(getJSON('/invalid-json', fakeFetch), SyntaxError);
  await assert.rejects(fetchWithTimeout('/slow', 5), TimeoutError);
  assert.equal((await fetchWithTimeout('/users', 100)).length, 2);
  await assert.rejects(fetchWithTimeout('/404', 100), HTTPError);
});
