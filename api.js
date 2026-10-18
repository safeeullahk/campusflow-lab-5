import { analyzeResults } from './analytics.js';

export class HTTPError extends Error {
  constructor(status) { super(`HTTP request failed: ${status}`); this.name = 'HTTPError'; this.status = status; }
}
export class TimeoutError extends Error {
  constructor(milliseconds) { super(`Request timed out after ${milliseconds}ms`); this.name = 'TimeoutError'; }
}

export async function getJSON(url, fetchImplementation) {
  const response = await fetchImplementation(url);
  if (!response.ok) throw new HTTPError(response.status);
  return await response.json();
}

const users = [{ id: 1, name: 'Ali', department: 'CS' }, { id: 2, name: 'Sara', department: 'AI' }];
const routes = {
  '/users': users,
  '/courses': [{ code: 'FSWD' }],
  '/results': [{ id: 1, course: 'FSWD', marks: 82 }, { id: 2, course: 'FSWD', marks: 47 }]
};

export function fakeFetch(url, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      if (url === '/network-error') return reject(new TypeError('Network failure'));
      const status = url === '/500' ? 500 : (Object.hasOwn(routes, url) || ['/invalid-json', '/slow'].includes(url)) ? 200 : 404;
      resolve({ ok: status >= 200 && status < 300, status, async json() {
        if (url === '/invalid-json') throw new SyntaxError('Invalid JSON response');
        return structuredClone(routes[url] ?? { message: status === 200 ? 'Slow success' : 'HTTP failure' });
      } });
    }, url === '/slow' ? 100 : 5);
    function abort() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    }
    signal?.addEventListener('abort', abort, { once: true });
  });
}

export async function loadDashboard(fetchImplementation = fakeFetch) {
  const [users, courses, results] = await Promise.all([
    getJSON('/users', fetchImplementation), getJSON('/courses', fetchImplementation), getJSON('/results', fetchImplementation)
  ]);
  if (![users, courses, results].every(Array.isArray)) throw new TypeError('API payloads must be arrays');
  const studentIds = new Set();
  users.forEach(user => {
    if (!user || user.id == null || studentIds.has(user.id)) throw new TypeError('Users require unique IDs');
    studentIds.add(user.id);
  });
  const joined = results.map(result => {
    const user = users.find(user => user.id === result?.id);
    if (!user) throw new Error('Result references an unknown student');
    return { ...user, ...result, name: user.name, department: user.department };
  });
  // Aggregate multiple course results per student before ranking/counting failures.
  const perStudent = users.flatMap(user => {
    const marks = joined.filter(row => row.id === user.id).map(row => row.marks);
    if (!marks.length) return [];
    marks.forEach(mark => { if (typeof mark !== 'number' || !Number.isFinite(mark) || mark < 0 || mark > 100) throw new RangeError('Invalid result marks'); });
    return [{ ...user, marks: marks.reduce((sum, mark) => sum + mark, 0) / marks.length }];
  });
  const analytics = analyzeResults(perStudent);
  return { totalStudents: users.length, totalCourses: courses.length, overallAverageMarks: analytics.average,
    highestPerformingStudent: analytics.ranked[0] ?? null,
    failedStudents: new Set(joined.filter(row => row.marks < 50).map(row => row.id)).size,
    departments: analytics.departments };
}

export async function fetchWithTimeout(url, milliseconds, fetchImplementation = fakeFetch) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new RangeError('Timeout must be positive');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new TimeoutError(milliseconds)), milliseconds);
  try {
    const response = await fetchImplementation(url, { signal: controller.signal });
    if (!response.ok) throw new HTTPError(response.status);
    return await response.json();
  } finally { clearTimeout(timer); }
}
