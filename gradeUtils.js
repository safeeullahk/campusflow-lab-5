export function validateMarks(marks) {
  if (typeof marks !== 'number' || !Number.isFinite(marks)) throw new TypeError('Marks must be a finite number');
  if (marks < 0 || marks > 100) throw new RangeError('Marks must be between 0 and 100');
  return marks;
}

export function calculateGrade(marks) {
  validateMarks(marks);
  const bands = [[85, 'A', 4], [80, 'A-', 3.67], [75, 'B+', 3.33], [70, 'B', 3], [65, 'B-', 2.67], [60, 'C+', 2.33], [50, 'C', 2], [0, 'F', 0]];
  const [, grade, gradePoints] = bands.find(([minimum]) => marks >= minimum);
  return { grade, gradePoints, status: marks >= 50 ? 'PASS' : 'FAIL' };
}

export function calculateAverage(marks) {
  if (!Array.isArray(marks)) throw new TypeError('Expected an array of marks');
  marks.forEach(validateMarks);
  return marks.length ? marks.reduce((sum, mark) => sum + mark, 0) / marks.length : null;
}

// Equal course weights: credit hours are not supplied by the lab.
export function calculateGPA(marks) {
  if (!Array.isArray(marks)) throw new TypeError('Expected an array of marks');
  return marks.length ? marks.reduce((sum, mark) => sum + calculateGrade(mark).gradePoints, 0) / marks.length : null;
}
