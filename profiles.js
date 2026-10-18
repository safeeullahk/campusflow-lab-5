function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
}

export function updateProfile(student, update = {}) {
  assertObject(student, 'Student');
  assertObject(update, 'Update');
  for (const field of ['address', 'contact']) {
    if (student[field] !== undefined) assertObject(student[field], field);
    if (update[field] !== undefined) assertObject(update[field], field);
  }
  const { address = {}, contact = {}, ...originalFields } = student;
  const { address: addressUpdate = {}, contact: contactUpdate = {}, ...updatedFields } = update;
  return { ...originalFields, ...updatedFields, address: { ...address, ...addressUpdate }, contact: { ...contact, ...contactUpdate } };
}

export function profileDetails(student, ...labels) {
  const { name: displayName = 'Unknown', address: { city = 'Unknown' } = {} } = student;
  const [primaryLabel = 'Student', ...otherLabels] = labels;
  const phone = student.contact?.phone ?? 'Not provided';
  return { displayName, city, phone, primaryLabel, otherLabels, marks: student.marks ?? 0, scholarship: student.scholarship ?? false };
}

export function compareReferences(original, updated) {
  return { sameObject: original === updated, sameAddress: original.address === updated.address, sameContact: original.contact === updated.contact };
}
