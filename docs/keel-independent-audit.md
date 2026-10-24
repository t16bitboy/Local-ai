# Keel independent audit and corrections

Date: 2026-10-23. Reviewed PR #1 at `edbcbdbff192a5cd2f8070503b610995e831d81f` and corrected the branch in this follow-up. This supersedes the unresolved findings in `keel-focused-review.md`; it does not replace the historical review evidence.

## Release decision

Keep PR #1 in draft pending a browser pass on the corrected revision. The confirmed store, test-gate, lifecycle and dependency defects are corrected and the automated gates pass. This supports continued prototype review, not a paid production release. No merge, deployment, paid API call, customer outreach or demand-validation result is claimed.

Before marking ready, verify desktop and mobile title clear/retype, blank/whitespace blur, Enter, task switching and reload against the actual app. Check midnight and reminder-time crossing without manually invoking store actions, plus wake/focus catch-up. Confirm no console errors or horizontal overflow on dev and production output. The clock unit test invokes the actual registered interval and event listeners, but does not mount React or prove browser notification delivery.

## Source custody

Retrieved the original `grok-workspace(2).zip`. SHA-256: `7bd4b1e65dc02661d63943213e628ff85af3eb0ef2e53423c3b5f2d1d392a282`, matching the earlier source review. Compared archive files under src, scripts, server, public and .grok without executing archived binaries. Excluding preview/status artifacts, 176 are byte-identical and none are missing. Thirteen differ in the corrected working tree: two brand images, the PWA metadata test fixture, and ten app/source files. Additional tests, review helpers and documentation are follow-up work. The initial import commit is `3b879f4883131a87ff905c2c0c7d29b4e69d08d4`.

This establishes continuity with the supplied archive. It does not establish commercial rights to every bundled dependency, font or asset, or validate market demand.

## Regression requirements

| Requirement | Evidence and result |
| --- | --- |
| Capture due dates | Relative month-boundary and valid/invalid ISO tests pass. Parser intentionally accepts trailing today/tomorrow/ISO phrases only. |
| Enforce Free open-task cap on reopening | Both done-to-open and done-to-doing are blocked at eight; reopening succeeds after a completion. These are local product rules, not security entitlements. |
| Preserve spaces while editing | Editor now keeps a draft and commits on blur/Enter. Store trims committed titles and rejects blanks. Unit tests cover committed multiword titles, blank rejection and rehydration. Browser typing remains unverified here. |
| Prevent duplicate task groups | Mutually exclusive doing/open predicates; each active task belongs to one group in the test. Hook task is excluded separately in Desk. |
| Avoid repeated generated steps | One case-insensitive normalization handles both incoming and existing steps. Mixed case, whitespace and truncation tests preserve original IDs and completion. |
| Restore next-day overdue alerts | Daily dismissals reset. App starts a 30-second refresh after hydration, listens for focus/visibility and removes listeners/timer on cleanup. Mock-clock test crosses midnight, crosses reminder time once and expires trial. Suspended/closed tabs cannot promise timely delivery. |
| Include focused task in capped AI input | Open and completed older focus tasks survive the 16-item cap without duplicate IDs. Brief passes focusId on all packing paths. |
| Persist local work | In-memory localStorage tests cover save/rehydrate, old blank-title repair and first visit without saved state. No cross-device, corrupt-state or quota-failure guarantee. |

## Corrections and security

- Replaced per-keystroke persistence with a local title buffer and a store-level nonempty-title invariant. Old nameless tasks load as “Untitled task”, preserving task ID, notes and other data. Rejected blank edits retain the prior title and provenance.
- Added Keel to `npm test`. A temporary failing Keel assertion made the default gate exit 1; the assertion was removed and the gate rerun successfully.
- Added clock lifecycle coverage and mixed-case step normalization.
- Production live AI now fails closed even if an API key and development opt-in exist. Local development requires NODE_ENV=development, KEEL_ALLOW_UNMETERED_AI=true and a server-held key. This is a temporary restriction, not implemented billing, identity, quota or abuse protection. Offline drafts remain available.
- Updated Zod from locked 4.6.5 to 4.6.7 after the registry audit identified GHSA-mrhx-c7xc-m3w5, oversized-collection memory exhaustion. Advisory: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5 (patched from 4.6.6). Final production dependency audit reports zero known vulnerabilities. This is not a comprehensive security certification.
- Assistant target URL is fixed, the provider key remains server-side, known IDs constrain structured edits and React renders model text as text. User application of model edits remains explicit. Prompt instructions are not an authorization boundary.

## Executed verification

- Clean dependency installation with install scripts disabled succeeded. The Zod update refreshed the lockfile.
- `npm test`: 269 passing tests: 197 script, 59 platform/connector/auth/path, 13 Keel.
- `npm run typecheck`: passed.
- `npm run build`: passed; no DATABASE_URL was present, so database migration intentionally skipped. This is not a database or deployment test.
- `npm audit --omit=dev`: zero known vulnerabilities after the Zod update.
- `git diff --check`: passed.
- Standalone review generation succeeded before the final legacy-title hydration guard; the production build was rerun after that correction. No generated review HTML is committed or represented as a newly verified visual preview.

## Execution limits

The dev server failed with `uv_interface_addresses` in this execution environment. The production preview process started, but the browser smoke command failed before navigation because its Chromium executable was absent. Both repository and runtime Playwright browser downloads failed. agent-browser was unavailable, so a direct browser smoke was attempted. No new browser interaction, screenshot inspection, real Notification delivery, live model request or production deployment passed in this audit. The auth invariant command was indeterminate because it could not observe the dev server, not because an auth mismatch was established.

At the reviewed head, GitHub returned no commit status entries and no pull-request workflow runs. Local results are execution evidence, not a GitHub CI approval. No independent reviewer approval is asserted.

## Remaining launch requirements

Server identity and account entitlements, a shared spending ledger with rate/budget enforcement, billing and checkout, durable account storage if required, verified product/pricing/compliance claims, and a validated initial customer workflow remain open. Calendar/Slack and background push remain absent. The operator console and plan choices are local previews. Enabling live AI in production requires replacing the closed policy with audited server controls, not setting a client flag or adding an environment key.
