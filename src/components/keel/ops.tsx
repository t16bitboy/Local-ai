import { useMemo, useState } from "react";
import {
  DOMAIN_YEAR,
  HOSTING,
  MEMO_CLAIMED_PER_DAY,
  MEMO_DOLLARS_PER_1K,
  MEMO_TOKENS_PER_DAY,
  PLATFORM_HIGH,
  PLATFORM_LOW,
  PLUGINS,
  ROUTES,
  inferenceCost,
  money,
  type MilestoneState,
  type RiskState,
} from "@/lib/keel/data";
import { useKeel } from "@/lib/keel/store";
import { FOCUS_OPTIONS, focusLabel } from "@/lib/keel/workspace";

const riskStates: RiskState[] = ["open", "watching", "mitigated"];
const mileStates: MilestoneState[] = ["queued", "building", "shipped"];

export function Ops() {
  const risks = useKeel((s) => s.risks);
  const milestones = useKeel((s) => s.milestones);
  const rules = useKeel((s) => s.rules);
  const setRisk = useKeel((s) => s.setRisk);
  const setMilestone = useKeel((s) => s.setMilestone);
  const toggleRule = useKeel((s) => s.toggleRule);
  const workspace = useKeel((s) => s.workspace);
  const patchWorkspace = useKeel((s) => s.patchWorkspace);
  const assistCount = useKeel((s) => s.assistCount);
  const gateHits = useKeel((s) => s.gateHits);
  const tasks = useKeel((s) => s.tasks);
  const [tokens, setTokens] = useState(MEMO_TOKENS_PER_DAY);
  const [rate, setRate] = useState(MEMO_DOLLARS_PER_1K);
  const [platform, setPlatform] = useState(200);

  const inference = useMemo(() => inferenceCost(tokens, rate), [tokens, rate]);
  const memoMatch = tokens === MEMO_TOKENS_PER_DAY && rate === MEMO_DOLLARS_PER_1K;
  const monthly =
    platform + inference.perMonth + HOSTING + PLUGINS + DOMAIN_YEAR / 12;
  const checked = rules.filter((r) => r.checked).length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="text-3xl">Ops</h2>
        <p className="mt-1 max-w-xl text-muted">
          The operator desk for this browser. One seat, no shared directory. October 2026 is month 1. Figures are planning numbers, not a live bill.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-line">
        <h3 className="text-xl">Workspace</h3>
        <p className="text-muted">
          {workspace.name ? workspace.name : "Unnamed"} · {focusLabel(workspace.focus)} · {workspace.activeDays.length} active day
          {workspace.activeDays.length === 1 ? "" : "s"} · {assistCount} assists · {gateHits} gates · {tasks.length} tasks on the desk.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
            Name
            <input
              value={workspace.name}
              onChange={(event) => patchWorkspace({ name: event.target.value.slice(0, 40) })}
              className="min-h-11 rounded-md bg-surface-2 px-3 text-base font-normal text-fg"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
            Reminder
            <input
              type="time"
              value={workspace.reminderTime}
              onChange={(event) => patchWorkspace({ reminderTime: event.target.value || "09:00" })}
              className="min-h-11 rounded-md bg-surface-2 px-3 text-base font-normal text-fg"
            />
          </label>
        </div>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={workspace.remindersOn}
            onChange={(event) => patchWorkspace({ remindersOn: event.target.checked })}
            className="size-5 accent-copper"
          />
          Reminders on
        </label>
        <div className="flex flex-col gap-2">
          {FOCUS_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => patchWorkspace({ focus: option.id })}
              aria-pressed={workspace.focus === option.id}
              className={
                workspace.focus === option.id
                  ? "min-h-11 rounded-md bg-copper px-3 text-left font-semibold text-ink"
                  : "min-h-11 rounded-md bg-surface-2 px-3 text-left text-fg"
              }
            >
              {option.title}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-xl">Inference arithmetic</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
            Tokens / day
            <input
              type="number"
              min={0}
              value={tokens}
              onChange={(e) => setTokens(Number(e.target.value))}
              className="min-h-11 rounded-md bg-surface px-3 text-base text-fg tabular-nums shadow-line"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
            $ per 1k tokens
            <input
              type="number"
              min={0}
              step={0.01}
              value={rate.toFixed(2)}
              onChange={(e) => setRate(Number(e.target.value))}
              className="min-h-11 rounded-md bg-surface px-3 text-base text-fg tabular-nums shadow-line"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
            Platform / month (${PLATFORM_LOW}–${PLATFORM_HIGH})
            <input
              type="number"
              min={PLATFORM_LOW}
              max={PLATFORM_HIGH}
              value={platform}
              onChange={(e) => setPlatform(Number(e.target.value))}
              className="min-h-11 rounded-md bg-surface px-3 text-base text-fg tabular-nums shadow-line"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure label="Inference / day" value={money(inference.perDay)} />
          <Figure label="Inference / month" value={money(inference.perMonth)} />
          <Figure label="Planning total / month" value={money(monthly)} />
        </div>
        {memoMatch ? (
          <p className="rounded-md bg-paper px-4 py-3 text-ink">
            The launch memo calls this volume about {money(MEMO_CLAIMED_PER_DAY)} a day (~{money(MEMO_CLAIMED_PER_DAY * 30)} a month).
            At {money(MEMO_DOLLARS_PER_1K)} per 1k tokens, {MEMO_TOKENS_PER_DAY.toLocaleString("en-US")} tokens is{" "}
            {money(inference.perDay)} a day, about {money(inference.perMonth)} a month. Budget the corrected line unless
            volume is closer to 1.5 million tokens a day.
          </p>
        ) : null}
        <ul className="grid gap-2 text-base text-muted sm:grid-cols-2">
          <li>No-code platform, memo range {money(PLATFORM_LOW)}–{money(PLATFORM_HIGH)}. Bubble’s production plan was cited near $135.</li>
          <li>Custom database, if you leave the no-code host: about {money(HOSTING)} (Aurora example).</li>
          <li>Plugins, up to {money(PLUGINS)}. Notifications (OneSignal or Firebase) mostly free at basic volume.</li>
          <li>Domain and SSL about {money(DOMAIN_YEAR)} a year. Stripe, when billing exists: 2.9% + $0.30.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xl">Roadmap</h3>
        <ul className="flex flex-col gap-3">
          {milestones.map((item) => (
            <li key={item.id} className="grid gap-3 rounded-lg bg-surface p-4 shadow-line sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-display text-2xl">{item.title}</p>
                <p className="text-sm text-muted">
                  {item.when} · {item.priority}
                </p>
              </div>
              <select
                aria-label={`${item.title} status`}
                value={item.state}
                onChange={(e) => setMilestone(item.id, e.target.value as MilestoneState)}
                className="min-h-11 rounded-md bg-surface-2 px-3 text-fg capitalize"
              >
                {mileStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xl">Risks</h3>
        <ul className="flex flex-col gap-3">
          {risks.map((risk) => (
            <li key={risk.id} className="rounded-lg bg-surface p-4 shadow-line">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h4 className="text-xl">{risk.title}</h4>
                <select
                  aria-label={`${risk.title} status`}
                  value={risk.state}
                  onChange={(e) => setRisk(risk.id, e.target.value as RiskState)}
                  className="min-h-11 rounded-md bg-surface-2 px-3 text-fg capitalize"
                >
                  {riskStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-2 text-muted">{risk.mitigation}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xl">Model router</h3>
        <p className="text-muted">
          Bring-your-own-model, as the memo describes it. Only Grok is connected. Standby rows are cost notes, not live calls.
        </p>
        <ul className="flex flex-col gap-3">
          {ROUTES.map((route) => (
            <li key={route.id} className="rounded-lg bg-surface p-4 shadow-line">
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-2xl">{route.name}</span>
                <span className={route.state === "live" ? "text-sm font-semibold text-copper" : "text-sm text-muted"}>
                  {route.state === "live" ? "Live" : "Standby"}
                </span>
              </p>
              <p className="mt-1 text-muted">{route.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xl">Privacy rules</h3>
        <p className="text-muted tabular-nums">
          {checked} of {rules.length} checked. The last one stays open on purpose.
        </p>
        <ul className="flex flex-col">
          {rules.map((rule) => (
            <li key={rule.id}>
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={rule.checked}
                  onChange={() => toggleRule(rule.id)}
                  className="size-5 accent-copper"
                />
                <span>{rule.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-4 shadow-line">
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}
