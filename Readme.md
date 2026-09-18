# LeetLove

Learn algorithms through stories, interactive execution, and practice.

## Stage 1: Maximum Average Subarray I

The first lesson teaches fixed-size sliding windows using LeetCode 643. Includes a camera-frame story, editable inputs, synchronized Python code, reversible playback, prediction prompts, and an independent challenge.

### Interactive modes

- **Hands-on:** choose the next incoming/outgoing array value, then decide whether to save the candidate window. Incorrect choices explain the rule without advancing execution.
- **Watch & explore:** play, pause, step, scrub, or inspect individual values.
- The moving frame, color-matched arithmetic, inline Python operation, and saved-best markers make each change visible.
- The window notebook remembers explored candidates while rewinding. Reset or applying input clears the notebook.
- At completion, the gold frame highlights the winning range; the return equation shows its average.

Use **Start hands-on lesson** to focus the active learning area. Narrow screens keep the current Python operation alongside the array. Reduced-motion preferences disable transitions.

## Run locally

Requires Node.js 20.9 or newer and npm.

    npm install
    npm run dev

Open http://localhost:3000. No API keys are required. Fonts load from Google Fonts when available, with sans-serif fallbacks.

## Checks

    npm test
    npm run typecheck
    npm run build

## Structure

- src/lib/lesson.ts: lesson content, validation, deterministic execution snapshots.
- src/app/page.tsx: interface and playback controls.
- src/components/window-lab.tsx: direct interaction, moving frame, arithmetic, and window notebook.
- src/app/globals.css: responsive styles and reduced-motion support.
- tests/lesson.test.ts: edge cases, validation, and comparisons with a brute-force oracle.

The canvas accepts up to 16 integers for readable exploration. The tracing function supports the problem's input bounds, but its snapshots use O(n) storage. The displayed Python algorithm uses O(n) time and O(1) auxiliary space.

## Scope

A local, single-lesson prototype. Progress is session-only. Code is displayed, not executed from user input. Accounts, AI generation, sandbox execution, publishing, and payments are future stages. Learner testing is still needed to validate the teaching experience.
