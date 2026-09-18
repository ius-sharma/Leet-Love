# Adding a LeetLove lesson

Stage 2 uses one lesson player and one visualization surface for all five lessons. Add content and an algorithm adapter; do not copy the page, timer, controls, storage, or canvas.

## Where things live

- `src/lessons/types.ts`: metadata, practice, learner challenge, and snapshot contracts.
- `src/lessons/catalog.ts`: lesson definitions, Python listings, examples, and practice content.
- `src/lessons/engine.ts`: validation and deterministic trace adapters. The average lesson reuses the verified core in `src/lib/lesson.ts`.
- `src/lib/player.ts`: pure navigation/interaction reducer.
- `src/lib/progress.ts`: versioned run restoration and serialization.
- `src/components/lesson-player.tsx`: shared lesson shell, modes, practice, input editor, and persistence lifecycle.
- `src/components/lesson-canvas.tsx`: array/string cells, selected ranges or individual indices, arithmetic, counts, metrics, and notebook.
- `src/app/learn/[slug]/page.tsx`: lookup, metadata, not-found behavior, and generated lesson routes.

## 1. Define the learning outcome

Name one pattern and the invariant the learner must protect. Write the misconception the hands-on decisions should reveal. Use an original story that maps directly to positions, values, and state changes. Explain when the analogy stops being useful.

Supply a short title for the library, the full problem title, an original objective, prerequisites, validated domain restrictions, complexity, a default example, and at least two edge presets. Link to the official problem statement. The canvas has an explicit 16-element/character limit; it does not claim to accept every online-judge input size.

Strings use an explicit character domain: lowercase English letters for vowel counting and printable ASCII for the unique-substring lesson. Spaces are retained and shown as a visible space glyph. Do not silently trim a string, sort an array, or replace invalid input.

## 2. Write a deterministic adapter

The adapter validates input and emits immutable snapshots. Each snapshot describes the state after its semantic operation, plus the challenge that a learner must answer to reach it from the preceding state.

Required fields include a stable step ID, semantic code operation, selected indices, saved-answer indices, pointers, metrics, equation, explanation, and visual tone. A contiguous window sets `range: true`; a two-pointer pair sets it to false and selects only its two endpoints.

The first snapshot is the initial state and has no incoming challenge. Every later snapshot needs an incoming challenge. The last snapshot has `tone: done` and a numeric or index-pair result. Empty/no-solution outcomes select nothing; never invent a winning range.

A cell challenge accepts one or more index strings. A choice challenge provides labelled options and accepted keys. Hints explain why an action fails without mutating the algorithm. If multiple choices are valid, include all valid keys. Comparison snapshots optionally become notebook checkpoints.

A trace is rejected if it exceeds 500 steps. It is never silently truncated. All calculations come from the adapter; animation callbacks are not a source of truth.

## 3. Map Python operations

Python is teaching content; learner code is not executed. Match each snapshot's semantic operation to its displayed Python operation. When a semantic step changes both a value and a pointer, make both changes visible in the mapped code. Keep the final display faithful to the returned value and its positions.

Run `npm run verify:python` to execute the authored Python listings on defaults and presets and compare their answers with the TypeScript traces. This developer check requires Python on PATH; the web app itself does not.

## 4. Add independent practice

Each lesson contains two fresh examples, a result question, and a reasoning question. At least one example should expose an edge case. Provide hints and explanations for correct answers.

Use numeric tolerance where applicable. Index-pair answers accept bracketed/unbracketed comma-separated positions and either order. Practice completion is saved only after the answer and reasoning check pass. Playing, scrubbing, or reaching the last frame never grants practice completion.

## 5. Integrate without a new player

Register the definition in the catalog and its adapter in the engine. Library cards, sidebar links, lesson URLs, tabs, mode controls, and practice forms are generated from this definition. If a new data structure is necessary, extend the snapshot contract and shared visual primitives deliberately, with tests. Avoid checking lesson titles inside the navigation reducer.

Increment the lesson version whenever a saved step or previous practice result would become incompatible. Restoration rebuilds the trace from validated input, clamps positions, clears playing state, and discards invalid versions. Reset run clears only run exploration; the library's separate reset control clears all local runs and practice results.

## 6. Validate

- Compare final results to an independently written brute-force oracle on generated valid cases.
- Assert intermediate invariants, selected values, saved ranges, and metrics.
- Check every code-operation mapping and every incoming challenge.
- Complete the lesson by feeding accepted actions through the reducer; reject stale repeated clicks and wrong actions.
- Test invalid input and its explanation.
- Test backward/forward movement, previously visited notebook cards, input replacement, reset, route changes, refresh, and practice completion.
- Run `npm test`, `npm run typecheck`, `npm run verify:python`, and `npm run build`.
- Use actual browser controls for keyboard, mobile, wrong-choice feedback, reduced-motion, and independent practice checks. Verify a production build as well as development.

## 7. Independent visual acceptance

A separate critic must capture the actual flow: entry, wrong action, correct action, important transitions, candidate comparison, result, and mobile views. Save representative PNGs with the review report.

The current acceptance threshold is 8.5/10 for each lesson and the shared experience, with at most five builder/review rounds. Any lower score receives ranked issues and a revision. A correctness defect blocks acceptance regardless of the average score. If five rounds are exhausted, report the outstanding issues honestly; do not lower the target.

Screenshots establish checkpoint clarity. They do not certify animation frame rate, all browsers, or educational effectiveness. Record real learner feedback separately.
