# CampusFlow — Lab 5

Requires Node.js 18 or newer. Uses only built-in JavaScript and Node modules; no package installation is needed.

## Run

Open a terminal in this folder:

```powershell
npm start
npm test
```

Alternatively use `node main.js` and `node lab.test.js`. The demo prints labeled outputs for Tasks 1–8. Expected error messages are intentional demonstrations, not program crashes. Tests check normal, boundary, and invalid cases.

## Submission

The supplied lab sheet does not specify a submission extension or require screenshots. Unless the instructor provides other instructions, submit a ZIP containing all `.js` files, `package.json`, and this README. Include console screenshots or a report only if your instructor requests them. Do not submit `node_modules` (none is needed).

## Files and decisions

- Task 1: `admissions.js`. Eligible applicants with paid fees are SELECTED; eligible applicants with unpaid fees are WAITING; academically ineligible applicants are REJECTED. Invalid fields prevent merit calculation. Program counts include valid and invalid applicants whose program is supported. Empty summary statistics are null; first input wins highest-merit ties.
- Task 2: `analytics.js`, `gradeUtils.js`. Marks must be finite numbers. Invalid rows throw rather than silently altering averages. Grade thresholds use continuous intervals, so 84.9 is A-. Pass mark is 50. Department names are dynamic. Sorting copies the source array.
- Task 3: `profiles.js`. Object spread creates fresh top-level, address and contact objects, so all three reference comparisons are false. Nested fields merge rather than replace their sibling fields. Absent values remain; explicit 0, false and empty strings survive. Null nested objects are rejected. Destructuring, renaming, defaults, rest, optional chaining, nullish coalescing and property shorthand appear in the service helpers. This is a targeted two-level merge, not a general deep clone.
- Task 4: `Person.js`, `Student.js`, `FacultyMember.js`. `new` invokes a constructor; `this` refers to the instance. `extends` establishes inheritance and `super` reuses the parent constructor/method. Overrides dispatch at runtime for mixed users. Students are both `instanceof Student` and `instanceof Person`. A detached class method has undefined `this` and throws; `call` supplies a receiver immediately and `bind` produces a permanently bound method.
- Task 5: `transcriptService.js`. JSON syntax errors remain SyntaxError, structural errors use TypeError, marks outside the range use RangeError, and duplicate IDs use Error. Numeric/string representations of the same ID count as duplicates. Empty courses yield null average/GPA. GPA is the mean of course grade points with equal weights because no credit hours are supplied. The grade point scale is A=4, A-=3.67, B+=3.33, B=3, B-=2.67, C+=2.33, C=2, F=0; the lab specifies letter grades but leaves points unspecified.
- Task 6: `LegacyRegistration` in `registration.js`. Each asynchronous stage uses an error-first callback and returns after an error. Nested dependent callbacks repeat error handling at every boundary; adding stages makes the nesting and control flow harder to maintain. This service uses no Promises or async/await.
- Task 7: `PromiseRegistration` in `registration.js`. Each chain stage returns its next Promise/value. Catch propagates failure and finally counts completed attempts. `allSettled` retains every notification outcome when SMS fails. `any` accepts the first success from independent servers and rejects with AggregateError only if all fail. `race` would accept an early rejection too. `all` is appropriate when every independent result is required; `race` is useful when the first settlement is desired. They are not added unnecessarily to the registration chain.
- Task 8: `api.js`. `Promise.all` starts dashboard requests concurrently. Fake routes cover success, unknown URL/404, `/500`, `/network-error`, `/invalid-json`, and `/slow`. Timeout uses AbortController and cleans its timer in finally; injected fetch implementations must honor the abort signal. HTTPError, TypeError, SyntaxError and TimeoutError distinguish failures. Dashboard averages/ranks use each student's mean across courses, students without results are excluded from performance statistics, and failure count means distinct students with any failed course. The fake data has one result per student.

`main.js` demonstrates default imports, named imports and an aliased named import, plus try/catch/finally. No function factory returns inner functions for retaining state. State belongs to objects; asynchronous callbacks implement the required service APIs.

