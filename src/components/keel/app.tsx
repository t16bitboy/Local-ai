import { useEffect } from "react";
import { BarChart3, BookOpen, ListTodo, MessagesSquare, Settings2 } from "lucide-react";
import { VIEWS, seedRisks, seedRules, type ViewId } from "@/lib/keel/data";
import { startKeelClock } from "@/lib/keel/lifecycle";
import { planLabel, useKeel } from "@/lib/keel/store";
import { Desk } from "@/components/keel/desk";
import { Brief } from "@/components/keel/brief";
import { Pulse } from "@/components/keel/pulse";
import { Ops } from "@/components/keel/ops";
import { Guide } from "@/components/keel/guide";
import { Onboard } from "@/components/keel/onboard";
import { AlertsMenu } from "@/components/keel/alerts-menu";
import { UpgradeDialog } from "@/components/keel/upgrade-dialog";

const icons: Record<ViewId, typeof ListTodo> = {
  desk: ListTodo,
  brief: MessagesSquare,
  pulse: BarChart3,
  ops: Settings2,
  guide: BookOpen,
};

export function KeelApp() {
  const onboarded = useKeel((s) => s.workspace.onboarded);

  useEffect(() => {
    let cancelled = false;
    let stopClock: (() => void) | undefined;
    const apply = () => {
      if (cancelled) return;
      const current = useKeel.getState();
      const freshLaw = seedRisks().find((risk) => risk.id === "law");
      const law = current.risks.find((risk) => risk.id === "law");
      const risks =
        freshLaw && law && !law.mitigation.includes("machine-readable")
          ? current.risks.map((risk) => (risk.id === "law" ? { ...freshLaw, state: "mitigated" as const } : risk))
          : current.risks;
      const seen = new Set(current.rules.map((rule) => rule.id));
      const rules = [...current.rules, ...seedRules().filter((rule) => !seen.has(rule.id))];
      if (risks !== current.risks || rules.length !== current.rules.length) {
        useKeel.setState({ risks, rules });
      }
      stopClock = startKeelClock();
    };
    const pending = useKeel.persist.rehydrate();
    if (pending instanceof Promise) void pending.then(apply);
    else apply();
    return () => { cancelled = true; stopClock?.(); };
  }, []);

  if (!onboarded) return <Onboard />;
  return <KeelShell />;
}

function KeelShell() {
  const view = useKeel((s) => s.view);
  const setView = useKeel((s) => s.setView);
  const plan = useKeel((s) => s.plan);
  const trialEnds = useKeel((s) => s.trialEnds);
  const openUpgrade = useKeel((s) => s.openUpgrade);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl md:grid md:grid-cols-[13.5rem_minmax(0,1fr)]">
        <aside className="hidden flex-col gap-6 border-r border-line px-4 py-6 md:flex">
          <Wordmark />
          <Nav view={view} onChange={setView} />
        </aside>
        <div className="flex min-w-0 flex-col pb-24 md:pb-8">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-bg/95 px-4 py-3 backdrop-blur-sm md:px-8">
            <div className="md:hidden">
              <Wordmark />
            </div>
            <p className="hidden text-sm text-muted md:block">Keep one piece of work on the hook.</p>
            <div className="flex items-center gap-2">
              <AlertsMenu />
            <button
              type="button"
              onClick={() =>
                openUpgrade(
                  plan === "free"
                    ? "Free includes the desk, three assists a day, and a breakdown of one task. Trial and Pro are for volume."
                    : "You can return to Free whenever you want. Nothing has been charged.",
                )
              }
              className="min-h-11 rounded-md bg-surface px-3 text-sm font-semibold text-fg shadow-line"
            >
              {plan === "free" ? "Upgrade" : planLabel(plan, trialEnds)}
            </button>
            </div>
          </header>
          <main className="flex-1 px-4 py-2 md:px-8 md:py-4">
            {view === "desk" ? <Desk /> : null}
            {view === "brief" ? <Brief /> : null}
            {view === "pulse" ? <Pulse /> : null}
            {view === "ops" ? <Ops /> : null}
            {view === "guide" ? <Guide /> : null}
          </main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg md:hidden" aria-label="Sections">
        <ul className="grid grid-cols-5">
          {VIEWS.map((item) => {
            const Icon = icons[item.id];
            const active = view === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setView(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "flex min-h-16 w-full flex-col items-center justify-center gap-1 text-copper"
                      : "flex min-h-16 w-full flex-col items-center justify-center gap-1 text-muted"
                  }
                >
                  <Icon className="size-5" aria-hidden />
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <UpgradeDialog />
    </div>
  );
}

function Wordmark() {
  return (
    <p className="font-display text-3xl leading-none tracking-tight">
      Keel
    </p>
  );
}

function Nav({ view, onChange }: { view: ViewId; onChange: (view: ViewId) => void }) {
  return (
    <nav aria-label="Sections">
      <ul className="flex flex-col gap-1">
        {VIEWS.map((item) => {
          const Icon = icons[item.id];
          const active = view === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex min-h-11 w-full items-center gap-3 rounded-md bg-surface px-3 font-semibold text-fg"
                    : "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-muted hover:bg-surface hover:text-fg"
                }
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
