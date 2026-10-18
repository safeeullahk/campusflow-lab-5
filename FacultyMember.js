import Person from './Person.js';
export default class FacultyMember extends Person {
  constructor(name, email, employeeId, department) {
    super(name, email);
    if (!employeeId || typeof department !== 'string' || !department.trim()) throw new TypeError('Employee ID and department are required');
    this.employeeId = employeeId;
    this.department = department;
  }
  introduce() { return `${super.introduce()} I teach in ${this.department} (employee ${this.employeeId}).`; }
}
