import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aiCap, FREE_OPEN_CAP, openCount, weekBars } from "@/lib/keel/data";
import { planLabel, useKeel } from "@/lib/keel/store";

export function Pulse() {
  const tasks = useKeel((s) => s.tasks);
  const plan = useKeel((s) => s.plan);
  const trialEnds = useKeel((s) => s.trialEnds);
  const gateHits = useKeel((s) => s.gateHits);
  const assistCount = useKeel((s) => s.assistCount);
  const usesToday = useKeel((s) => s.usesToday);
  const bars = weekBars(tasks);
  const open = openCount(tasks);
  const done = tasks.filter((t) => t.status === "done").length;
  const finishedThisWeek = tasks.filter((t) => t.completedAt && Date.now() - t.completedAt < 7 * 86400000).length;
  const cap = aiCap(plan);

  const gates = [
    {
      name: "Open-task cap",
      detail: plan === "free" ? `${open} of ${FREE_OPEN_CAP}` : "Lifted on this plan",
      hit: plan === "free" && open >= FREE_OPEN_CAP,
    },
    {
      name: "Daily assists",
      detail: `${usesToday()} of ${cap} today`,
      hit: usesToday() >= cap,
    },
    {
      name: "Board rewrite",
      detail: plan === "free" ? "Locked on Free" : "Included",
      hit: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-3xl">Pulse</h2>
        <p className="mt-1 max-w-xl text-muted">
          Counts from this browser only. {planLabel(plan, trialEnds)}. Billing is not connected, so there is no revenue number here.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open" value={String(open)} />
        <Stat label="Finished" value={String(done)} />
        <Stat label="This week" value={String(finishedThisWeek)} />
        <Stat label="Assists" value={String(assistCount)} />
      </div>

      <section className="rounded-lg bg-surface p-4 shadow-line">
        <h3 className="text-xl">Finished, last 7 days</h3>
        <div className="mt-3 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--color-surface-2)" }}
                contentStyle={{
                  background: "var(--color-paper)",
                  border: "none",
                  borderRadius: 12,
                  color: "var(--color-ink)",
                }}
              />
              <Bar dataKey="done" fill="var(--color-copper)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xl">Where Free stops</h3>
        <p className="text-muted">
          Gates hit in this browser: <span className="text-fg tabular-nums">{gateHits}</span>. A gate should explain the job, not just the price.
        </p>
        <ul className="grid gap-3 md:grid-cols-3">
          {gates.map((gate) => (
            <li key={gate.name} className="rounded-lg bg-surface p-4 shadow-line">
              <p className="text-sm font-semibold tracking-wide text-muted uppercase">{gate.hit ? "At the gate" : "Room left"}</p>
              <p className="mt-1 font-display text-2xl">{gate.name}</p>
              <p className="mt-1 text-muted tabular-nums">{gate.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-4 shadow-line">
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-4xl tabular-nums">{value}</p>
    </div>
  );
}
