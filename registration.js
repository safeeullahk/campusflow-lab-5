// Each demo gets independent state; no functions return state-retaining functions.
export function createRegistrationData() {
  return {
    students: [{ id: 101, completed: ['CS301'] }, { id: 102, completed: [] }],
    courses: [{ code: 'CS401', prerequisite: 'CS301', seats: 2 }, { code: 'FULL', prerequisite: 'CS301', seats: 0 }],
    registrations: []
  };
}

export class LegacyRegistration {
  constructor(data = createRegistrationData()) { this.data = structuredClone(data); }
  loadStudent(id, callback) {
    setTimeout(() => {
      const student = this.data.students.find(item => item.id === id);
      if (!student) return callback(new Error('Student does not exist'));
      return callback(null, { ...student, completed: [...student.completed] });
    }, 5);
  }
  checkPrerequisites(student, code, callback) {
    setTimeout(() => {
      const course = this.data.courses.find(item => item.code === code);
      if (!course) return callback(new Error('Course does not exist'));
      if (!student.completed.includes(course.prerequisite)) return callback(new Error('Prerequisite not completed'));
      return callback(null, { student, course: { ...course } });
    }, 5);
  }
  checkAvailableSeats(context, callback) {
    setTimeout(() => {
      if (context.course.seats <= 0) return callback(new Error('Course is full'));
      return callback(null, context);
    }, 5);
  }
  registerCourse(context, callback) {
    setTimeout(() => {
      const { student, course } = context;
      if (this.data.registrations.some(row => row.studentId === student.id && row.course === course.code)) return callback(new Error('Student already registered'));
      // Recheck live seats at the commit boundary to handle concurrent requests.
      const liveCourse = this.data.courses.find(item => item.code === course.code);
      if (!liveCourse || liveCourse.seats <= 0) return callback(new Error('Course is full'));
      const confirmation = { studentId: student.id, course: course.code, status: 'REGISTERED' };
      liveCourse.seats -= 1;
      this.data.registrations.push(confirmation);
      return callback(null, { ...confirmation });
    }, 5);
  }
  register(id, code, callback) {
    this.loadStudent(id, (error, student) => {
      if (error) return callback(error);
      this.checkPrerequisites(student, code, (error, context) => {
        if (error) return callback(error);
        this.checkAvailableSeats(context, (error, available) => {
          if (error) return callback(error);
          this.registerCourse(available, callback);
        });
      });
    });
  }
}

export class PromiseRegistration {
  constructor(data = createRegistrationData()) { this.data = structuredClone(data); this.completedWorkflows = 0; }
  getStudent(id) {
    return new Promise((resolve, reject) => setTimeout(() => {
      const student = this.data.students.find(item => item.id === id);
      return student ? resolve(structuredClone(student)) : reject(new Error('Student does not exist'));
    }, 5));
  }
  getCourse(student, code) {
    return new Promise((resolve, reject) => setTimeout(() => {
      const course = this.data.courses.find(item => item.code === code);
      return course ? resolve({ student, course: { ...course } }) : reject(new Error('Course does not exist'));
    }, 5));
  }
  checkPrerequisites(context) {
    return Promise.resolve().then(() => {
      if (!context.student.completed.includes(context.course.prerequisite)) throw new Error('Prerequisite not completed');
      return context;
    });
  }
  checkSeats(context) {
    return Promise.resolve().then(() => {
      if (context.course.seats <= 0) throw new Error('Course is full');
      return context;
    });
  }
  registerStudent(context) {
    return Promise.resolve().then(() => {
      const { student, course } = context;
      if (this.data.registrations.some(row => row.studentId === student.id && row.course === course.code)) throw new Error('Student already registered');
      const liveCourse = this.data.courses.find(item => item.code === course.code);
      if (!liveCourse || liveCourse.seats <= 0) throw new Error('Course is full');
      const confirmation = { studentId: student.id, course: course.code, status: 'REGISTERED' };
      liveCourse.seats -= 1;
      this.data.registrations.push(confirmation);
      return { ...confirmation };
    });
  }
  sendEmail(confirmation) { return Promise.resolve({ recipient: confirmation.studentId, sent: true }); }
  sendSMS() { return Promise.reject(new Error('SMS provider unavailable')); }
  writeAuditLog(confirmation) { return Promise.resolve({ recorded: confirmation }); }
  register(id, code) {
    return this.getStudent(id)
      .then(student => this.getCourse(student, code))
      .then(context => this.checkPrerequisites(context))
      .then(context => this.checkSeats(context))
      .then(context => this.registerStudent(context))
      .then(confirmation => Promise.allSettled([
        this.sendEmail(confirmation), this.sendSMS(confirmation), this.writeAuditLog(confirmation)
      ]).then(outcomes => ({ confirmation, services: outcomes.map((outcome, index) => ({
        service: ['Email', 'SMS', 'Audit'][index], status: outcome.status,
        ...(outcome.status === 'rejected' ? { error: outcome.reason.message } : {})
      })) })))
      .catch(error => { throw error; })
      .finally(() => { this.completedWorkflows += 1; });
  }
}

export function selectCourseServer(servers) {
  return Promise.any(servers.map(server => Promise.resolve().then(server)));
}
