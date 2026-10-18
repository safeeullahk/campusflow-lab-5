export default class Person {
  constructor(name, email) {
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.includes('@')) throw new TypeError('A name and email are required');
    this.name = name;
    this.email = email;
  }
  introduce() { return `I am ${this.name} (${this.email}).`; }
}
