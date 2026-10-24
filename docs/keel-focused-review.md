# Focused Keel review

Follow-up corrections and current release decision: [independent audit](keel-independent-audit.md). Findings below describe the historical reviewed revision.

Reviewed 2026-10-23 against PR #1 head `8c073602359eddaa2637b39604af59b1c0e0bac1` and the supplied ZIP. Decision: keep the PR in draft. Do not merge this revision yet. No application code was changed during this review.

The 208-file import establishes source custody. It is not evidence of customer demand or completed product functionality. The substantive task-desk changes are in store.ts, data.ts, desk.tsx and brief.tsx, with eight regression tests.

## Findings

### P1: The title-space fix now persists empty titles and breaks assistant validation

Location: src/lib/keel/store.ts:143, src/components/keel/task-detail.tsx:49, src/lib/keel/assist.ts:7.

Previously patchTask trimmed a title and retained the existing title when the result was empty. The replacement preserves spaces but also accepts an empty string. The controlled input writes every keystroke directly to persisted state. Selecting all text and deleting it saves a nameless task immediately. Reload does not restore its previous title.

Verified by executing patchTask('t-mvp', { title: '' }): both the store and keel-v2 contain an empty title, and packTasks includes it. The live assistant input schema requires every packed title to have at least one character. Such a request is rejected before a model call. No live provider call was made to reproduce this.

Required correction: keep in-progress title text in an editor draft. Commit a trimmed nonempty title on blur or Enter, restore the prior title for an empty commit, and preserve spaces while typing. Add coverage for clear-and-retype, empty blur, whitespace-only blur, and reload. A store-level check must keep persisted titles valid even if called outside the component.

### P2: The new regression suite is absent from the default test command

Location: package.json scripts.test and scripts.test:keel.

npm test runs the platform and connector/auth/path tests. The eight task-desk tests run only through npm run test:keel. The README documents both commands, so the prior 264-test result is accurate, but the ordinary default test gate does not protect these fixes.

Required correction: include the Keel suite in npm test, or add an explicit required CI gate that runs both commands. Confirm a deliberate failure in a Keel test causes the required gate to fail.

### P2: Next-day alerts are tested only after a manual visit, not in a continuously open tab

Location: src/components/keel/app.tsx:25, src/lib/keel/store.ts noteVisit, src/components/keel/alerts-menu.tsx, src/lib/keel/regression.test.ts:56.

The new test sets lastSeen to yesterday and calls noteVisit directly. That verifies the return-visit path. The app calls noteVisit only in its mount effect. It has no clock-driven or visibility/focus refresh. A dismissed overdue alert stays dismissed when an existing tab crosses midnight. Scheduled notifications also have no timer. Trial expiry is likewise refreshed only at mount.

This lifecycle gap already existed in the supplied app. The recent change fixes next-visit clearing, not continuous-tab rollover. Do not describe the test as proof of the wider behavior.

Required correction: explicitly choose return-visit-only behavior and disclose it, or add a lifecycle clock with cleanup and visibility/focus refresh. Test midnight rollover and reminder-time crossing without calling store refresh actions directly.

### P3: Step deduplication treats case inconsistently within one payload

Location: src/lib/keel/store.ts:203.

Existing-step comparison is case-insensitive, but the incoming Set is case-sensitive. Executing attachSteps('t-cap', ['Review plan', 'review plan'], 'offline') produces two steps. The repeated-apply test covers exact repetitions only.

Suggested correction: use one normalized key for both existing and incoming steps while retaining the first display text. Cover mixed case, whitespace, duplicate incoming values, and completion/ID preservation.

## What the current tests establish

All eight regression tests were rerun and pass. That confirms their narrow assertions, not absence of the findings above. The prior combined run reported 264 passes. It was not repeated wholesale for this read-only review. Persistence testing uses a memory-backed localStorage stub, not browser quota failures, corruption, or cross-device behavior.

The grouping and focus-preservation fixes match their stated intent. The date parser deliberately supports only trailing today, tomorrow, and valid ISO dates. It is not a general natural-language date parser.

## Merge and launch gates are separate

Resolve P1 and the test-gate gap before merging this revision. Resolve or explicitly scope the lifecycle behavior. Keep the PR in draft meanwhile. Server spending controls, entitlements, verified claims and any required sync remain paid-launch blockers even after code-review fixes. This review does not authorize a paid launch.
