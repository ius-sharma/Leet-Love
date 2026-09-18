# LeetLove

Learn algorithms through stories, direct interaction, and independent practice.

## Stage 2 — the learning library

Five lessons share the same deterministic player, visual primitives, navigation, and progress system:

1. Maximum Average Subarray I
2. Maximum Number of Vowels in a Substring of Given Length
3. Minimum Size Subarray Sum
4. Longest Substring Without Repeating Characters
5. Two Sum II — Input Array Is Sorted

Open the library at `/`; lessons have stable `/learn/<problem-slug>` URLs.

### Learn by doing

- **Hands-on:** choose a value or a semantic action. Wrong choices explain the rule without advancing.
- **Watch & explore:** inspect values, play/pause, change speed, step, or scrub the timeline.
- The current Python operation, arithmetic, selected range/pair, saved answer, and optional character counts stay synchronized.
- The exploration notebook keeps visited candidates when you rewind.
- Each lesson has an original story, invariant, edge presets, and two independent practices with reasoning checks.

### Progress

Saved in this browser/device only. Runs resume after refresh. Practice completion is separate from watching the animation. Reset run preserves practice completion; Reset library progress clears all local runs and results. Invalid or incompatible saved data falls back to a fresh run. Storage failure leaves the lesson usable without persistence.

## Run locally

Requires Node.js 20.9+ and npm.

    npm install
    npm run dev

Open http://localhost:3000. No API keys or backend service are required. Google Fonts are optional; local font fallbacks work when the network is unavailable.

## Verify

    npm test
    npm run typecheck
    npm run verify:python
    npm run build

The Python parity check requires Python on PATH and executes only the authored lesson solutions. Python is not required to run the website. The test suite includes generated oracle comparisons, intermediate invariants, input validation, guided decisions, stale-action protection, replay/history, and versioned restoration.

Independent visual reviews and screenshots are in `reviews/stage-2/`. Browser checks use actual interactive flows; automated algorithm tests do not substitute for screenshot or learner reviews.

## Structure

- `src/lessons/`: typed content, code mappings, validation, and algorithm adapters.
- `src/lib/player.ts`: shared pure playback reducer.
- `src/lib/progress.ts`: storage schema and validated restoration.
- `src/components/lesson-player.tsx`: lesson shell and practice.
- `src/components/lesson-canvas.tsx`: shared visual primitives and learner decisions.
- `src/components/learning-library.tsx`: discovery, resume, and progress.
- `src/app/academy.css`: responsive styling and reduced-motion support.
- `tests/`: algorithm, player, and persistence checks.
- `docs/lesson-authoring.md`: adding a supported lesson without copying the engine.

## Scope and limits

The teaching canvas accepts up to 16 values/characters and 500 trace steps. Vowels use lowercase English letters; unique-substring uses printable ASCII including spaces and allows empty input. Numeric prerequisites are validated, including positive values for the minimum-length window and sorted input with exactly one matching pair for Two Sum II.

Snapshots add O(number of teaching steps) storage beyond the displayed algorithm's auxiliary-space complexity. Python is displayed, not executed from learner input. Accounts, remote progress, AI generation, sandboxed submissions, payments, and publishing remain later stages. Real learner validation is still pending.
