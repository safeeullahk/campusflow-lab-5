export const programs = ['BSCS', 'BSSE', 'BSAI'];

export function processApplicant(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { status: 'INVALID DATA', merit: null, errors: ['Applicant must be an object'] };
  const applicant = { ...input };
  for (const field of ['id', 'name']) {
    if (typeof input[field] !== 'string' || !input[field].trim()) errors.push(`${field} is required`);
  }
  for (const field of ['age', 'matricMarks', 'intermediateMarks', 'entryTest']) {
    const value = input[field];
    if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim())) {
      errors.push(`${field} is missing or not numeric`);
      continue;
    }
    applicant[field] = Number(value);
    if (!Number.isFinite(applicant[field])) errors.push(`${field} is not a finite number`);
    else if (field === 'age' ? applicant[field] < 17 || applicant[field] > 30 : applicant[field] < 0 || applicant[field] > 100) errors.push(`${field} is outside its permitted range`);
  }
  switch (input.program) {
    case 'BSCS': case 'BSSE': case 'BSAI': break;
    default: errors.push('Unsupported program');
  }
  if (input.feePaid === true || input.feePaid === 'true') applicant.feePaid = true;
  else if (input.feePaid === false || input.feePaid === 'false') applicant.feePaid = false;
  else errors.push('feePaid must be true or false');
  if (errors.length) return { ...applicant, status: 'INVALID DATA', merit: null, errors };
  const merit = applicant.matricMarks * 0.2 + applicant.intermediateMarks * 0.3 + applicant.entryTest * 0.5;
  const eligible = merit >= 70 && applicant.entryTest >= 60 && applicant.intermediateMarks >= 60;
  let status;
  if (!eligible) status = 'REJECTED';
  else status = applicant.feePaid ? 'SELECTED' : 'WAITING';
  return { ...applicant, merit, eligible, status, errors };
}

export function processAdmissions(applicants) {
  if (!Array.isArray(applicants)) throw new TypeError('Applicants must be an array');
  const processed = applicants.map(processApplicant);
  const valid = processed.filter(applicant => applicant.status !== 'INVALID DATA');
  const counts = Object.fromEntries(programs.map(program => [program, 0]));
  for (const applicant of processed) if (programs.includes(applicant.program)) counts[applicant.program] += 1;
  return { applicants: processed, summary: {
    valid: valid.length, invalid: processed.length - valid.length,
    highestMeritApplicant: valid.reduce((best, applicant) => !best || applicant.merit > best.merit ? applicant : best, null),
    lowestMerit: valid.length ? Math.min(...valid.map(applicant => applicant.merit)) : null,
    averageMerit: valid.length ? valid.reduce((sum, applicant) => sum + applicant.merit, 0) / valid.length : null,
    applicantsPerProgram: counts
  } };
}
