# First workflow to validate

Status: hypothesis, not validated demand. No outreach was sent, participants recruited, or payments collected.

## Customer and job

Customer: a solo brand-design freelancer with at least two active client projects and recurring delivery or revision deadlines.

Job: spend five minutes each morning choosing one client deliverable to finish, the next small action, and one follow-up that prevents a project from stalling.

Example input: a logo proof due tomorrow, a revision request, and a client waiting on a file handoff. Example output: one prioritized deliverable, a short editable breakdown, and a visible due date. Keel already demonstrates manual prioritization, task breakdown templates and local completion tracking. Its offline draft is a template, not an AI-generated plan. Do not claim it reads inboxes, integrates with Fiverr, or automatically manages clients.

This niche is chosen as a narrow test compatible with the current prototype and the existing brand-kit work context. That is a scope decision, not proof of a market.

## Validate before adding features

1. Interview five people who match the customer definition. Ask for a recent real delivery-planning problem, the exact last incident, its cost, their current workaround, and what they already use or pay for. Look for behavior, not compliments about the demo.
2. If at least three independently describe a recurring problem, invite them to a five-workday manual pilot. Use sanitized task labels and the offline review. Do not connect client accounts or ask them to upload confidential briefs.
3. At the first session, record the current planning method and approximate time it takes. Observe whether they can make their first plan without help. Do not claim time savings without comparing observed before/after behavior.
4. Record voluntary use, plans created, deliverables completed, support required, and reasons for dropping out. Count reminders or researcher-led sessions separately from self-initiated use.
5. Discuss an explicit hypothetical price and ask what existing tool or process this would replace. Record the answer, then ask for a concrete next step such as booking a second-week session. Do not collect payment before the paid-launch blockers are resolved.

## Decision gate

Proceed to a second validation round only if at least three of the five describe the same recurring problem and at least two pilot users voluntarily make plans on four of five workdays and ask to continue. Record both the value and the support burden. These thresholds are chosen experiment rules, not industry benchmarks or statistical proof.

If the problem is rare, usage requires repeated prompting, or a plain checklist performs equally well, stop feature work and revise the customer/problem hypothesis. If the workflow proves useful without AI, keep AI optional rather than assuming it creates the value.

A passing pilot justifies further validation and a scoped implementation plan. It does not establish product-market fit, pricing, or a $10K/month forecast.

## Current evidence limits

A small web search on 2026-10-23 returned general freelancer time-management articles and surveys of other professions. It did not establish demand or willingness to pay among solo brand-design freelancers. No quantitative market claim is based on those snippets. Direct customer evidence is still missing.

## Build order after evidence

First resolve the narrow merge-review defects listed in keel-focused-review.md. Defer expansion features while testing the workflow. After demand evidence supports continued investment, implement server-side request/spend controls and account entitlements before enabling paid customer AI traffic. Add durable account-backed sync only if the pilot establishes a multi-device need. Verify launch claims and production behavior before taking payment.
