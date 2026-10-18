import { calculateAverage, calculateGPA, validateMarks } from './gradeUtils.js';

export function processTranscripts(rawData) {
  if (typeof rawData !== 'string') throw new TypeError('Transcript input must be JSON text');
  const students = JSON.parse(rawData);
  if (!Array.isArray(students)) throw new TypeError('Transcript root must be an array');
  const seen = new Set();
  const reports = students.map(student => {
    if (!student || !((typeof student.id === 'number' && Number.isFinite(student.id)) || (typeof student.id === 'string' && student.id.trim()))) throw new TypeError('Student ID is required');
    const key = String(student.id).trim();
    if (seen.has(key)) throw new Error(`Duplicate student ID: ${key}`);
    seen.add(key);
    if (typeof student.name !== 'string' || !student.name.trim()) throw new TypeError('Student name is required');
    if (!Array.isArray(student.courses)) throw new TypeError('Courses must be an array');
    const courses = student.courses.map(course => {
      if (!course || typeof course.code !== 'string' || !course.code.trim()) throw new TypeError('Course code is required');
      validateMarks(course.marks);
      return { code: course.code.trim(), marks: course.marks };
    });
    const marks = courses.map(course => course.marks);
    return { id: student.id, name: student.name, courses, average: calculateAverage(marks), gpa: calculateGPA(marks) };
  });
  const report = { students: reports, totalStudents: reports.length };
  return { report, json: JSON.stringify(report, null, 2) };
}
