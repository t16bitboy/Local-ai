# Local AI Ops: Keel foundation

Keel is the imported task-desk prototype for Travis's Local AI Ops project. It provides a browser-saved task board, due dates, offline draft planning, a conditional live assistant route, and local progress views.

The broader plan targets business owners and creators first. This prototype needs a specific customer workflow and validated demand before it becomes that launch product.

## Run and check

Use Node 22.18+ or Node 24.

- `npm ci`
- `npm run dev`
- `npm run typecheck`
- `npm test`
- `npm run test:keel`
- `npm run build`
- `npm run build:review` creates `review/Keel-Fixed-Preview.html`, a self-contained review with offline drafts and embedded fonts.

The normal application uses a server-only `XAI_API_KEY` for user-initiated model requests. Without it, the assistant reports that it is unavailable and offers explicitly labeled offline drafts. The standalone review has no model endpoint.

## Status

Seven reported regressions are fixed: date capture, reopening at the Free cap, spaces while editing, duplicate task groups, repeated step application, next-day overdue alerts, and retaining the selected task in assistant requests. Eight regression tests include local-save rehydration.

The existing platform metadata tests now use isolated fixtures, and the dependency lockfile supports clean installation.

Billing and plan changes are local previews. There is no checkout, production account entitlement enforcement, cross-device task sync, or implemented calendar/Slack workflow. Client-side assist caps do not enforce a server-side spending budget. Those remain launch blockers.

Historical pricing and compliance notes in the supplied app are unverified product copy, not launch sign-off.
