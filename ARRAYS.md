# Arrays chapter

Open `/arrays` for the learning path. Five interactive missions cover traversal,
maximum, in-place reversal, hash lookup, and sorted two pointers. Each has
Understand, Play, Code, and Check stages. Stage navigation stays open for learners
who already know a concept. Guided choices never grant completion: a successful
code run plus the reasoning answer is required. Browser-local completion is a
learning convenience, not an authoritative credential or mastery certificate.

The roadmap links to 31 selected LeetCode practice problems. Those are external
practice, not 31 implemented interactive lessons. Later mixed assessments,
spaced-review scheduling, and account-synced chapter progress remain future work.

## Enable actual Python runs

The chapter and draft storage work without credentials. The runner uses the
existing E2B sandbox, never a local subprocess for user code, and Supabase auth.

1. Apply `db/migrations/001_solution_studio.sql` if not already installed, then
   `db/migrations/002_array_runs.sql` in the project's Supabase SQL editor.
2. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `E2B_API_KEY`, and `E2B_TEMPLATE_ID` on the server.
3. Set `LEETLOVE_ARRAY_RUNS_ENABLED=true` after applying the migration.
4. Sign in through `/create`, return to the saved Arrays draft, and run checks.

No Groq API key or background studio worker is required for Arrays runs. Hosting
must allow the Node route to run up to 60 seconds and include
`workers/python/runner.py` in its deployment. The sandbox enforces its existing
per-process CPU/memory limits and a 30-second cumulative execution budget. The
database atomically enforces one active run and 30 reservations per account/day.
Abandoned reservations expire after 90 seconds. Failed runs consume a reservation.

The first test produces a validated line trace from the exact submitted source.
Remaining tests include negative numbers, duplicates, empty/singleton cases where
valid, and a fresh input. Pair judges accept any valid distinct pair and enforce
the mission's zero-/one-based convention. Reversal checks both result and mutated
input. Small correctness tests do not certify asymptotic complexity. Trace replay
shows actual source lines and locals; the guided cargo scene is separately authored
and is never presented as a trace of user code. Integer dictionary keys serialize
as strings; collisions between integer and string keys are rejected explicitly.

Progress and code drafts are versioned, validated, and stored on this browser.
Code verdicts are invalidated on edits and are not trusted across page reloads.
Unavailable services and storage failures are shown without inventing results.

## Validation

```
npm run typecheck
npm test
npm run test:tracer
npm run build
# With the development server on localhost:3000:
npx playwright test tests/e2e/arrays.spec.ts --workers=1
```

The Python tests execute repository-owned fixtures only. The browser tests cover
all five guided journeys, wrong choices, draft restoration, completion gating,
and mobile overflow. An authenticated live E2B/Supabase smoke test is additionally
required in the configured deployment; local checks cannot certify those services.
