import { calculateGrade, calculateAverage, validateMarks } from './gradeUtils.js';

export function analyzeResults(results) {
  if (!Array.isArray(results)) throw new TypeError('Results must be an array');
  const everyMarkValid = results.every(row => row && typeof row.marks === 'number' && Number.isFinite(row.marks) && row.marks >= 0 && row.marks <= 100);
  results.forEach(row => {
    if (!row || typeof row.name !== 'string' || !row.name.trim() || typeof row.department !== 'string' || !row.department.trim()) throw new TypeError('Each result needs a name and department');
    validateMarks(row.marks);
  });
  const processed = results.map(row => ({ ...row, ...calculateGrade(row.marks) }));
  const ranked = [...processed].sort((a, b) => b.marks - a.marks || a.name.localeCompare(b.name));
  const average = calculateAverage(results.map(row => row.marks));
  const departments = processed.reduce((stats, row) => {
    const group = stats[row.department] ?? { students: 0, total: 0, highest: 0, passed: 0 };
    group.students += 1;
    group.total += row.marks;
    group.highest = Math.max(group.highest, row.marks);
    group.passed += row.status === 'PASS' ? 1 : 0;
    stats[row.department] = group;
    return stats;
  }, Object.create(null));
  Object.values(departments).forEach(group => { group.average = group.total / group.students; delete group.total; });
  return { processed, ranked, departments, average, queries: {
    firstAbove85: processed.find(row => row.marks > 85) ?? null,
    firstFailedIndex: processed.findIndex(row => row.status === 'FAIL'),
    anyFailed: processed.some(row => row.status === 'FAIL'), everyMarkValid,
    aboveAverage: processed.filter(row => row.marks > average),
    topThreeNames: ranked.slice(0, 3).map(row => row.name)
  } };
}
