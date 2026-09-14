# LeetLove

Learn algorithms through stories, interactive execution, and practice.

## Stage 1: Maximum Average Subarray I

The first lesson teaches fixed-size sliding windows using LeetCode 643. Includes a camera-frame story, editable inputs, synchronized Python code, reversible playback, prediction prompts, and an independent challenge.

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
- src/app/globals.css: responsive styles and reduced-motion support.
- tests/lesson.test.ts: edge cases, validation, and comparisons with a brute-force oracle.

The canvas accepts up to 16 integers for readable exploration. The tracing function supports the problem's input bounds, but its snapshots use O(n) storage. The displayed Python algorithm uses O(n) time and O(1) auxiliary space.

## Scope

A local, single-lesson prototype. Progress is session-only. Code is displayed, not executed from user input. Accounts, AI generation, sandbox execution, publishing, and payments are future stages. Learner testing is still needed to validate the teaching experience.
