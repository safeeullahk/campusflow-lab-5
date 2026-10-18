import Student from './Student.js';
import Person from './Person.js';
import FacultyMember from './FacultyMember.js';
import { calculateGrade as gradeFor } from './gradeUtils.js';
import { processAdmissions } from './admissions.js';
import { analyzeResults } from './analytics.js';
import { updateProfile, profileDetails, compareReferences } from './profiles.js';
import { processTranscripts } from './transcriptService.js';
import { LegacyRegistration, PromiseRegistration, selectCourseServer } from './registration.js';
import { getJSON, fakeFetch, loadDashboard, fetchWithTimeout } from './api.js';

function show(task, result) { console.log(`\n${task}`); console.dir(result, { depth: null }); }

const applicants = [
  { id: 'A101', name: 'Sara Khan', age: '19', matricMarks: '91', intermediateMarks: '87', entryTest: '78', program: 'BSCS', feePaid: 'true' },
  { id: 'A102', name: 'Ahmed Ali', age: 'twenty', matricMarks: '88', intermediateMarks: '', entryTest: '72', program: 'BSSE', feePaid: 'false' },
  { id: 'A103', name: 'Hassan', age: '18', matricMarks: '76', intermediateMarks: '83', entryTest: '91', program: 'BSAI', feePaid: 'true' }
];
show('Task 1: Admissions', processAdmissions(applicants));
const results = [
  { id: 1, name: 'Ali', department: 'CS', course: 'FSWD', marks: 82 },
  { id: 2, name: 'Sara', department: 'CS', course: 'FSWD', marks: 91 },
  { id: 3, name: 'Usman', department: 'SE', course: 'FSWD', marks: 47 },
  { id: 4, name: 'Hina', department: 'AI', course: 'FSWD', marks: 73 },
  { id: 5, name: 'Ahmed', department: 'SE', course: 'FSWD', marks: 64 },
  { id: 6, name: 'Zoya', department: 'AI', course: 'FSWD', marks: 91 }
];
show('Task 2: Analytics', analyzeResults(results));
const original = { id: 101, name: 'Ali', marks: 0, scholarship: false, address: { city: 'Islamabad', sector: 'F-10' }, contact: { email: 'ali@university.edu' } };
const updated = updateProfile(original, { name: 'Ali Khan', address: { city: 'Rawalpindi' }, contact: { phone: '03001234567' } });
show('Task 3: Profile update', { original, updated, details: profileDetails(updated, 'Student', 'Active'), references: compareReferences(original, updated) });
const student = new Student('Ali', 'ali@university.edu', 101, 82);
const users = [student, new Student('Sara', 'sara@university.edu', 102, 91), new FacultyMember('Hina', 'hina@university.edu', 'F01', 'CS'), new FacultyMember('Ahmed', 'ahmed@university.edu', 'F02', 'AI')];
show('Task 4: User hierarchy', student.getResult());
users.forEach(user => console.log(user.introduce()));
console.log(Person.prototype.introduce.call({ name: 'Dr. Ahmed', email: 'ahmed@example.com' }));
const fn = student.introduce;
try { fn(); } catch (error) { console.log('Detached method:', error.name, error.message); }
console.log(student.introduce.bind(student)());
console.log('instanceof Student / Person:', student instanceof Student, student instanceof Person);
const rawData = JSON.stringify([{ id: 101, name: 'Ali', courses: [{ code: 'CS301', marks: 81 }, { code: 'CS302', marks: 74 }] }]);
for (const text of [rawData, '{invalid']) {
  try { show('Task 5: Transcript', processTranscripts(text)); }
  catch (error) { console.log('Transcript error:', error.name, error.message); }
  finally { console.log('Transcript attempt finished.'); }
}
// Task 6 uses callbacks only, including sequencing the demonstration cases.
const legacy = new LegacyRegistration();
legacy.register(101, 'CS401', (error, confirmation) => {
  show('Task 6: Callback registration', error?.message ?? confirmation);
  legacy.register(999, 'CS401', error => console.log('Callback failure:', error.message));
});
const modern = new PromiseRegistration();
try { show('Task 7: Promise registration', await modern.register(101, 'CS401')); }
catch (error) { console.log('Registration failed:', error.message); }
show('Task 7: First successful server', await selectCourseServer([
  () => Promise.reject(new Error('Server one offline')),
  () => Promise.resolve({ code: 'CS401', server: 2 })
]));
show('Task 8: Concurrent dashboard', await loadDashboard());
for (const url of ['/404', '/500', '/network-error', '/invalid-json']) {
  try { await getJSON(url, fakeFetch); }
  catch (error) { console.log(url, error.name, error.message); }
}
try { await fetchWithTimeout('/slow', 10); }
catch (error) { console.log('Timeout demo:', error.name, error.message); }
console.log('Named import alias demo:', gradeFor(85));
