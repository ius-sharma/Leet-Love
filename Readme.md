# LeetLove

**See the solution. Understand the algorithm.**

LeetLove is a visual learning platform for LeetCode problems. It brings problem discovery, interactive algorithm walkthroughs, and independent practice into one workspace—helping learners understand how a solution works and why each step matters.

[The vision](#the-vision) · [Features](#features) · [Getting started](#getting-started) · [Solution Studio](#solution-studio) · [Roadmap](#roadmap)

## The vision

Reading a solution is only the beginning. Building intuition means understanding what changes, what stays true, and why the next move is valid.

LeetLove aims to make that process visible:

1. **Discover a problem** in a broad, searchable LeetCode catalog.
2. **Find a visual solution** through a clear availability badge.
3. **Explore the reasoning** through stories, moving pointers, changing values, and synchronized code.
4. **Make decisions yourself** and receive feedback along the way.
5. **Practice independently** to carry the pattern into a new problem.

The goal is a polished learning product where a growing visual library sits alongside the wider problem catalog. Catalog coverage and visual-solution coverage are separate: a listed problem does not imply that a LeetLove walkthrough is available.

## Features

### Problem explorer

- **4,060 problem records** in the September 22, 2026 catalog snapshot.
- Search by problem title or number, filter by difficulty, and browse with pagination.
- Filter for available visual solutions or save problems to a personal bookmark collection.
- Open individual problem pages with difficulty, acceptance rate, Premium status, and a link to LeetCode.
- See explicit availability labels for LeetLove visual solutions.
- Browse desktop tables or compact problem cards on mobile.

Problem statements and Premium content remain on LeetCode. Acceptance rates reflect the saved snapshot, not live statistics.

### Interactive visual learning

- **Hands-on mode:** choose the next value or action and receive feedback on incorrect decisions.
- **Watch & explore:** play, pause, rewind, step through execution, or adjust playback speed.
- **Execution map:** jump between operations while keeping the canvas and Python code synchronized.
- **Visible algorithm state:** inspect pointers, selected ranges, arithmetic, saved answers, and character counts where relevant.
- **Story-led explanations:** connect each algorithm to an analogy and the rule it must preserve.
- **Independent practice:** answer fresh examples and reasoning checks after exploring the solution.

Watching a walkthrough does not mark its practice complete. Lesson progress and bookmarks are stored in the current browser; they do not sync across devices.

### Available visual solutions

| Problem | Pattern | Difficulty |
| --- | --- | --- |
| [643. Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i/) | Fixed-size sliding window | Easy |
| [1456. Maximum Number of Vowels in a Substring of Given Length](https://leetcode.com/problems/maximum-number-of-vowels-in-a-substring-of-given-length/) | Fixed-size sliding window | Medium |
| [209. Minimum Size Subarray Sum](https://leetcode.com/problems/minimum-size-subarray-sum/) | Variable-size sliding window | Medium |
| [3. Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | Variable-size sliding window | Medium |
| [167. Two Sum II — Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) | Two pointers | Medium |

Each lesson includes an interactive walkthrough, editable teaching inputs, edge-case presets, and two practice exercises.

## Getting started

Use **Node.js 22 or newer** and npm.

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

The problem explorer, authored visual lessons, and recorded Studio examples work without API keys. Live solution submission and generated explanations require the optional services described below.

To run a production build locally:

```bash
npm run build
npm start
```

### Routes

| Route | Purpose |
| --- | --- |
| `/` | Problem explorer, search, filters, and bookmarks |
| `/problems/<slug>` | Problem metadata and visual-solution availability |
| `/learn/<slug>` | Authored interactive lesson and practice |
| `/create` | Solution Studio and recorded examples |
| `/s/<id>` | A published Studio explanation, when available |

### Refresh the catalog

```bash
npm run catalog:sync
```

The command fetches public metadata from LeetCode, validates the response, and updates [src/data/problems.json](src/data/problems.json). The app uses this checked-in snapshot, so browsing does not depend on a runtime connection to LeetCode.

Refresh is manual. The current source does not include topic tags, so topic filtering is not yet available. Adding a catalog record does not create a visual lesson.

## Solution Studio

Solution Studio extends the learning experience to a learner’s own Python approach. Its implemented workflow validates a supported solution, records execution in a sandbox, and generates a story tied to the recorded steps.

Recorded examples can be explored immediately. Live generation requires configuration and a separately running worker; it is not enabled by the basic local setup.

### Optional service setup

1. Copy [config/studio.env.example](config/studio.env.example) to `.env.local` and fill in the values locally.
2. Configure Supabase email/password authentication and apply [db/migrations/001_solution_studio.sql](db/migrations/001_solution_studio.sql).
3. Configure an E2B sandbox template with Python 3 and Linux resource-limit support.
4. Configure Groq for story generation.
5. Run the app and start the worker in a separate terminal:

   ```bash
   npm run worker
   ```

Keep service-role and provider credentials private. `.env.local` is ignored by Git. Leave `LEETLOVE_PUBLISHING_ENABLED=false` until the configured deployment has passed sandbox, account-isolation, and publication checks.

The Studio currently supports the five listed problems and a restricted Python subset. Validation is against the project's own test suites; it is not a LeetCode submission or acceptance verdict. End-to-end behavior depends on the configured services and requires live verification before public use.

## Development

### Technology

| Area | Stack |
| --- | --- |
| Application | Next.js App Router, React, TypeScript |
| Interface | CSS, Lucide icons, Framer Motion |
| Lesson playback | Deterministic algorithm traces and shared player state |
| Validation | Zod, TypeScript tests, Python tracer tests |
| Optional Studio services | Supabase, E2B, Groq |

### Project structure

```text
branding/                Approved logo concept and brand direction
config/                  Environment configuration template
src/app/                 Routes, API handlers, and styling
src/components/          Problem explorer, lesson player, and Studio UI
src/data/                LeetCode catalog snapshot
src/lessons/             Authored lessons, algorithm adapters, and traces
src/lib/                 Playback state and browser progress storage
src/server/studio/       Studio service integrations and request handling
src/submissions/         Supported submission contracts and recorded examples
workers/                 Studio job worker and Python execution tracer
db/migrations/           Studio database schema
scripts/                 Catalog sync and verification utilities
tests/                   Algorithm, playback, catalog, and tracer tests
```

### Verification

```bash
npm test
npm run typecheck
npm run build
```

For authored Python parity and tracer verification, also run:

```bash
npm run verify:python
npm run test:tracer
```

Python must be available on `PATH` for these two commands. It is not required for browsing the catalog or using authored lessons.

Tests cover algorithm results against independent oracles, intermediate state, input validation, guided decisions, playback, progress restoration, and catalog-to-lesson mapping. Browser interaction and visual review remain part of checking the learning experience.

## Roadmap

- Expand visual coverage across more problems and algorithm patterns.
- Apply the approved **Progress Heart** identity in **Royal Blue** and **Emerald Green** throughout the product.
- Add richer discovery with topic metadata and learning paths.
- Introduce scheduled catalog refresh and cross-device learning progress.
- Validate and refine live Solution Studio workflows for public use.
- Improve explanations and interactions through real learner feedback.

These are product directions, not claims of currently available functionality. The selected logo reference and palette are recorded in [branding/README.md](branding/README.md).

## Current boundaries

Authored teaching inputs are intentionally small—up to 16 values or characters—with bounded traces of up to 500 steps. Individual lessons validate their own requirements, such as positive values, sorted input, and supported character sets. Displayed algorithm complexity describes the algorithm; the teaching player additionally stores execution snapshots.

LeetLove is an independent project and is not affiliated with or endorsed by LeetCode. Problem names and catalog metadata refer to LeetCode; original problem content is accessed through its website.
