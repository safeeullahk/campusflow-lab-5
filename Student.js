import Person from './Person.js';
import { calculateGrade } from './gradeUtils.js';

export default class Student extends Person {
  constructor(name, email, rollNo, marks) {
    super(name, email);
    calculateGrade(marks);
    if (rollNo === undefined || rollNo === null || rollNo === '') throw new TypeError('Roll number is required');
    this.rollNo = rollNo;
    this.marks = marks;
  }
  introduce() { return `${super.introduce()} My student roll number is ${this.rollNo}.`; }
  getResult() { return { rollNo: this.rollNo, marks: this.marks, ...calculateGrade(this.marks) }; }
}
