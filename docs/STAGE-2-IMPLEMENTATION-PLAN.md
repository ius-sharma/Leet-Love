# Stage 2 implementation plan — a reusable learning library

Status: approved implementation plan. Review policy updated to the user's implementation request: at least 8.5/10, up to five rounds.
Prepared: 2026-09-18.

## 1. Outcome and scope

Stage 2 turns the single interactive lesson into a coherent, five-lesson learning path. Learners should be able to discover a lesson, learn through direct manipulation, solve an independent variation, and return later with their progress intact on the same browser.

This is the small-library stage in our agreed roadmap. Custom-code execution and AI auto-animation remain the following stage; they are not dependencies for this work.

The central engineering outcome is that adding a supported lesson requires its content, algorithm adapter, interaction rules, and tests—not a copied page or a new playback engine.

Deliverables:

- Five complete lessons, including the existing Maximum Average Subarray I.
- A shared lesson shell, deterministic player, array/string visual primitives, and reusable interaction controls.
- A library page, stable lesson URLs, prerequisites, and next-lesson navigation.
- Local progress, resumable sessions, and independent practice checks.
- Algorithm verification, browser regression checks, and independent screenshot reviews.
- A lesson-authoring guide demonstrated by the final lesson addition.

Outside this stage: sign-in, cloud synchronization, public submissions, payments, code execution, AI-generated animations, 3D, mobile apps, and enterprise features. Python remains the displayed teaching language; TypeScript implements the deterministic traces. We do not run learner code.

## 2. What we have and what must change

Current evidence:

- `src/lib/lesson.ts` contains one lesson, input parsing, and a frame format specialized to sums and window positions.
- `src/app/page.tsx` owns lesson content, playback, predictions, practice, and navigation in one component.
- `src/components/window-lab.tsx` contains direct cell choices, comparison decisions, arithmetic, a moving frame, and a notebook; it imports the specific lesson's Python listing.
- `src/app/globals.css` contains the interface styles and successive visual refinements.
- `tests/lesson.test.ts` covers trace correctness, input validation, replay, saved winners, and negative-number behavior.
- The final Stage 1 critic review scored 8.2/10. Its screenshot evidence supports clarity, not learning effectiveness or measured animation frame rate.

Preserve during extraction:

- Correct choices advance execution; wrong choices explain the mistake without advancing.
- Backtracking preserves explored notebook entries; Reset and applied input clear the run.
- Complete and partial windows are distinguished.
- The current code operation remains beside the canvas on small screens.
- Completion emphasizes the answer, including the actual winning range.
- Reduced-motion support and keyboard access remain available.

Remaining polish to carry forward: stabilize the action area's height without clipping long feedback, simplify the accumulated CSS, and make the active lesson easy to enter without excessive scrolling. The two wording errors listed in the critic report were already corrected and should not be reopened as unfinished work.

## 3. Proposed curriculum

Five lessons provide three related patterns rather than five unrelated visualization systems. Verify each referenced problem's official statement and bounds during authoring; the table below specifies our intended teaching approach rather than reproducing those statements.

| Order | Lesson | Pattern | Learner action | What it proves about reuse |
|---|---|---|---|---|
| 1 | Maximum Average Subarray I | Fixed-size window | Choose outgoing/incoming values; save or keep best | Migrated baseline preserves existing behavior |
| 2 | Maximum Number of Vowels in a Substring of Given Length | Fixed-size window with a count | Classify entering/leaving characters; update the count | Same player works with strings and a different metric |
| 3 | Minimum Size Subarray Sum | Variable-size window over positive values | Choose expand versus shrink; save a shorter valid range | Window length and validity can change independently |
| 4 | Longest Substring Without Repeating Characters | Variable-size window with uniqueness state | Resolve duplicates; shrink until valid; save best | Shared canvas supports auxiliary counts and a validity rule |
| 5 | Two Sum II — Input Array Is Sorted | Two pointers | Choose which pointer moves based on the pair sum | Renderer supports non-contiguous selection and a distinct invariant |

Each lesson includes:

1. A short, original story mapped explicitly to variables and operations.
2. A precise objective, allowed inputs, and a worked example.
3. The invariant: what must remain true after each operation.
4. A basic approach and why repeated work can be reduced.
5. A hands-on trace with useful feedback for likely mistakes.
6. A watch/explore mode and an inspection affordance.
7. Two independent practice variations, including an edge case.
8. An explanation check: why the operation is valid, not merely a numeric answer.
9. Correctness and complexity notes tied to the actual displayed solution.

Content constraints matter: the shrinking rule for Minimum Size Subarray Sum relies on positive inputs; Two Sum II relies on sorted input. Validate these prerequisites rather than silently sorting or changing learner data. For string lessons, state the supported character domain and keep displayed positions, tracing, and Python indexing consistent. Broader Unicode handling is a separate explicit decision, not an accidental behavior.

## 4. Architecture and contracts

Retain Next.js, React, TypeScript, and the existing styling approach. No new service or animation framework is required to start. Read the installed Next.js guides before changing routing or rendering boundaries, as required by AGENTS.md.

Suggested structure:

    src/app/page.tsx                         library entry
    src/app/learn/[slug]/page.tsx            lesson route
    src/components/lesson/                  shell, story, code, practice
    src/components/visuals/                 cells, ranges, pointers, metrics
    src/lib/player/                        types, reducer, navigation
    src/lib/progress/                      storage, versioning, restoration
    src/lessons/registry.ts                 metadata and lesson lookup
    src/lessons/<slug>/                     content, trace, checks, examples
    tests/algorithms/                      reference and invariant tests
    tests/player/                          state transitions and persistence
    tests/browser/                         interaction and layout regressions
    reviews/stage-2/                        critic reports and screenshots
    docs/lesson-authoring.md                how to add a supported lesson

Use three contracts:

**Lesson definition:** stable ID, version, title, pattern, prerequisites, story, input rules, examples, code listing, adapter, and practice tasks. Keep human-facing content separate from runtime rendering logic.

**Algorithm adapter:** validates input and produces ordered, immutable snapshots with stable step IDs, semantic operation IDs, visual state, explanations, and available learner decisions. An adapter owns algorithm semantics; the generic player must not know what a window sum or vowel count means.

**Renderer/interaction contract:** typed primitives for data cells, selected ranges, individually selected indices, pointers, metrics, equations, annotations, and saved answers. Typed actions include selecting a cell, selecting a decision, and submitting a numeric response. Lesson-specific state remains typed in its adapter; avoid an unstructured bag of optional fields.

The displayed Python listing maps semantic operation IDs to line IDs. Avoid scattering numeric line offsets through traces; a code edit should have one clear mapping to update and a test that catches missing operations.

Build only the primitives demanded by these lessons. A general-purpose visual-programming language, plugin marketplace, and universal code-to-animation schema are unnecessary here.

## 5. Player behavior

Use a reducer with explicit actions such as load lesson, apply input, choose action, next, back, seek, play, pause, reset, and finish. Keep current step, furthest explored step, and lesson completion separate.

Required behavior:

- Invalid input leaves the previous valid run intact and explains the issue.
- Applying valid input pauses playback, creates a new run, clears transient feedback, and resets run exploration.
- Seeking or stepping backward pauses playback and clears obsolete feedback; explored notebook entries remain available.
- Reset clears the current run's exploration without deleting completion records for the entire library. Provide a separate, clearly labeled progress-reset control.
- Guided mode requires the correct semantic action to advance; watch mode permits transport navigation. Exploring the timeline never grants practice completion.
- Wrong answers remain on the same snapshot and receive targeted feedback. Where several answers are valid, validators accept all valid answers rather than only one authored response.
- Autoplay stops at the final frame, route changes, mode switches, and new input. Timer callbacks cannot advance an old lesson after navigation.
- Fast repeated clicks cannot skip a required decision or leave metrics, highlights, and code on different steps.
- The final visual state represents the result, with any remaining execution state clearly distinguished.

Use stable element identities and transitions derived from adjacent states. Arithmetic and code are always rendered from the selected snapshot, never inferred from animation completion callbacks. Scrubbing may snap directly to a valid state; it need not play every intermediate animation. Reduced motion preserves all information without movement.

Keep a deliberate visual input limit and a trace-size budget. Start with at most 16 displayed values/characters and a 500-step safety ceiling, then adjust only with measured evidence. Never silently truncate a trace and present a partial result as the answer. Algorithm functions can be tested against larger valid inputs independently of the teaching canvas.

## 6. Library and progress experience

Library cards show the pattern, learning objective, prerequisites, and status. Avoid badges or fabricated time estimates that suggest learning has been measured when it has not.

Routes:

- `/`: learning library with recommended sequence and resume action.
- `/learn/<slug>`: directly addressable lesson.
- Unknown slugs: a useful not-found page with a library link.

Statuses: not started, in progress, and practice completed. Watching a final frame is recorded as exploration, not mastery. Completion requires the independent practice checks; describe it as practice completion rather than proving interview readiness.

Local storage records a schema version, lesson version, input, current/furthest step, mode, practice results, and update time. Recreate and validate the trace when restoring; do not store a large array of animation snapshots. Validate restored JSON and clamp or discard stale positions. If a lesson changes incompatibly, restart its run with a clear explanation.

Handle unavailable storage, corrupt data, and old versions without breaking the lesson. Read browser storage after hydration to avoid server/client markup mismatches. Progress is local to the browser and device; state that near resume/reset controls. No account or remote analytics is required.

## 7. Implementation milestones and order

### Milestone A — Extract the existing lesson

- Split the page into a lesson shell, player controls, story, practice panel, and code viewer.
- Define shared contracts and migrate Maximum Average Subarray I into a lesson module.
- Remove the specific lesson import from the visualizer.
- Introduce the reducer and stable semantic code mapping.
- Consolidate styles while preserving the reviewed layout and mobile operation context.

Exit gate: existing example, negative values, rewind/history, wrong/correct choices, reset, final winner, and keyboard operation still pass. Independent critic scores the migrated experience at least 8.5 before it becomes the new baseline.

### Milestone B — Prove reuse with the vowel lesson

- Add character cells and a count metric using the same player and range renderer.
- Author classify/count prompts, examples, feedback, and two practice variations.
- Demonstrate that changing the objective does not require duplicated transport or navigation logic.

Exit gate: a second complete lesson uses the same player. Both lessons pass algorithm, browser, and critic checks. Do not broaden the abstraction until this evidence exists.

### Milestone C — Add discovery and local continuation

- Add the registry, library cards, lesson routes, prerequisites, and next-lesson navigation.
- Add versioned local progress and resume behavior.
- Verify direct links, refresh, switching lessons mid-playback, corrupt storage, and unavailable storage.

Exit gate: a learner can start either lesson, return after refresh, and continue correctly; independent practice completion persists without confusing it with mere playback progress.

### Milestone D — Add variable-size windows

- Implement Minimum Size Subarray Sum first: target, validity, expand/shrink, shortest valid answer.
- Implement Longest Substring Without Repeating Characters next: character counts, duplicate detection, and repeated shrink decisions.
- Reuse existing range/pointer primitives and add only the auxiliary state panel required by the lessons.

Exit gate: both lessons correctly distinguish valid/invalid and partial states, handle boundary cases, and teach why shrinking is allowed. Each has a critic score of at least 8.5.

### Milestone E — Add two pointers and stabilize the library

- Implement Two Sum II with two selected indices, pair sum, movement decisions, and final pair emphasis.
- Ensure the shared renderer does not imply that every problem selects a contiguous window.
- Write the authoring guide from the actual steps used to add this lesson.
- Perform the library-wide regression and learner walkthrough.

Exit gate: five usable lessons, consistent navigation and progress, passing verification, and documented learner feedback.

These are sequential delivery gates rather than promised calendar dates. After Milestone B, use actual implementation and review effort to estimate the remaining work. Each milestone should produce a reviewable local preview and a short change summary.

## 8. Verification and independent critic loop

Algorithm checks:

- Compare optimized results with independently written brute-force/reference implementations on generated valid inputs.
- Check each intermediate invariant, selected range, metric, and saved answer—not only the final result.
- Include negatives and ties where allowed, k=1 and k=n for fixed windows, no valid target window, repeated characters, boundary pointer positions, and permitted extreme values.
- Test Python/trace operation mapping and use shared example expectations to detect drift between the displayed solution and the TypeScript adapter.

Player/storage checks:

- Correct and incorrect decisions, backward/forward navigation, history preservation, reset, input replacement, lesson switching, timer cleanup, and versioned restoration.
- Reload in both modes, recover from invalid storage, and ensure independent practice is not marked complete through timeline navigation.

Browser checks:

- Complete each hands-on lesson using actual controls; exercise at least one wrong choice and one edge input.
- Test desktop, a representative narrow mobile viewport, keyboard-only interaction, visible focus, reduced motion, and browser refresh.
- Check long values, horizontal scrolling, feedback expansion, code readability, and focus preservation.
- Inspect a production build as well as development; verify no console errors on critical flows.

Preserve the user's critic process for every material visual iteration:

1. Builder delivers a runnable candidate with a clear scope.
2. A separate critic takes screenshots at initial/focused entry, wrong action, correct action, a key transition, comparison, completion, and mobile equivalents.
3. Critic evaluates algorithmic visual accuracy, direct interaction, animation clarity, code alignment, and viewport usability. It supplies a 0–10 score and ranked issues, with screenshot evidence and observation limits.
4. A score of 4–7 is usable but not ready. Below 8, builder addresses the ranked issues and returns a new candidate. Scores from 8 to below 8.5 also require improvements to meet the acceptance threshold.
5. Stop at 8.5 or above, or after five builder/review rounds for that candidate. If still below 8.5 after round five, report the unresolved issues and keep it out of the finished library; do not quietly lower the threshold.

Visual correctness defects block acceptance even if an overall score is high. A screenshot score is not a substitute for algorithm tests or learner evidence. If the critic cannot access the browser, repair the review environment; do not manufacture a score from source inspection.

## 9. Learner validation and division of work

My work: architecture, implementation, lesson drafts, algorithm verification, responsive/accessibility checks, critic coordination, and delivery documentation. I will make routine engineering choices within this scope and surface decisions that materially affect the product.

Your work: evaluate whether the lessons match your intended experience, recruit a small initial group of target learners, and help prioritize actual points of confusion. This does not block implementation milestones A–E, but real learner feedback remains necessary before calling the teaching approach validated.

Suggested pilot: 3–5 learners, used as qualitative feedback rather than a statistically significant study. For at least two patterns, ask them to:

- Explain the current state before pressing anything.
- Choose the next action and explain why it is valid.
- Solve a fresh example after closing the visualization.
- Describe any point where movement, color, instructions, or code disagreed with their expectation.

Record wrong turns, hints needed, successful independent solutions, and short observations. Obtain consent before recording anyone. A simple local observation sheet is sufficient; do not add remote tracking just for this pilot.

## 10. Risks and controls

| Risk | Control |
|---|---|
| Generalizing around only one lesson creates the wrong engine | Prove contracts with the second lesson before expanding |
| Five lessons become five copies of the same page | Shared player, common primitives, adapter-owned semantics |
| More UI makes the core action harder to see | Preserve focus entry, inline code, and screenshot review on mobile |
| Users learn to click highlighted answers | Ask decisions before revealing actions; use independent variations |
| Python listing and trace diverge | Semantic operation mapping, shared expected results, code review |
| Animation completion corrupts state | Deterministic snapshots remain authoritative |
| Local progress falsely implies mastery | Explicit exploration versus practice-completed statuses |
| Saved runs break after content updates | Versioned schema, validated restoration, clear reset behavior |
| Critic scores become cosmetic | Require accuracy evidence, actual flows, and learner follow-up |
| Content work expands indefinitely | Five lessons, two practices each, three supported pattern families |

## 11. Stage completion checklist

Stage 2 implementation is complete when:

- All five lessons are discoverable, directly linkable, and usable end to end.
- The existing lesson retains its reviewed behavior after extraction.
- Every lesson uses shared playback and visual primitives without copied engine logic.
- Hands-on and watch modes, input validation, rewind, notebook, and result emphasis are correct.
- Each lesson has an original explanation, invariant, examples, two practice variations, and useful corrective feedback.
- Same-browser resume and practice status work, including storage/version failure cases.
- Algorithm, player, browser, type, and production-build checks pass.
- Each new lesson and materially changed shared flow receives an independent critic score of at least 8.5 within the stated review policy.
- Review reports and representative screenshots are saved with the candidate they evaluated.
- The authoring guide demonstrates how to add another supported lesson.

Record learner-pilot results separately. If recruitment has not happened, describe the release as implementation-complete and awaiting learner validation, not educationally validated.

First implementation task: extract the existing Maximum Average Subarray I lesson into the shared contracts and player, while preserving its current experience. That creates the foundation for every subsequent milestone.
