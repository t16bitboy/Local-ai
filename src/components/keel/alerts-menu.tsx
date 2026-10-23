import { useState } from "react";
import { Bell } from "lucide-react";
import { buildAlerts } from "@/lib/keel/workspace";
import { useKeel } from "@/lib/keel/store";

export function AlertsMenu() {
  const tasks = useKeel((s) => s.tasks);
  const workspace = useKeel((s) => s.workspace);
  const dismissAlert = useKeel((s) => s.dismissAlert);
  const [open, setOpen] = useState(false);
  const alerts = buildAlerts(tasks, workspace);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={alerts.length > 0 ? `${alerts.length} reminders` : "Reminders"}
        onClick={() => setOpen((value) => !value)}
        className="relative grid size-11 place-items-center rounded-md bg-surface text-fg shadow-line"
      >
        <Bell className="size-5" />
        {alerts.length > 0 ? (
          <span className="absolute top-1 right-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-copper px-1 text-xs font-semibold text-ink tabular-nums">
            {alerts.length}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg bg-surface p-3 shadow-line-strong">
          <p className="px-1 text-sm font-semibold tracking-wide text-muted uppercase">Reminders</p>
          {alerts.length === 0 ? (
            <p className="px-1 py-3 text-muted">Nothing is tapping you. The hook is quiet, or you already cleared today’s notes.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {alerts.map((alert) => (
                <li key={alert.id} className="rounded-md bg-surface-2 px-3 py-3">
                  <p className="font-semibold">{alert.title}</p>
                  <p className="mt-1 text-sm text-muted">{alert.detail}</p>
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    className="mt-2 min-h-11 text-sm font-semibold text-copper"
                  >
                    Clear
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="px-1 pt-2 text-sm text-muted">
            {workspace.remindersOn
              ? `In-app after ${workspace.reminderTime}. A system notice only fires while this tab is open.`
              : "Reminders are off. Turn them on in Ops."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
