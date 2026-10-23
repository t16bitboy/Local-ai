import { dueLabel, hookTask, localISODate, type Task } from "@/lib/keel/data";

export type Focus = "ship" | "day" | "plan";

export type Workspace = {
  onboarded: boolean;
  name: string;
  focus: Focus;
  reminderTime: string;
  remindersOn: boolean;
  lastSeen: string;
  returnFrom: string | null;
  digestOn: string | null;
  dismissed: string[];
  activeDays: string[];
};

export const FOCUS_OPTIONS: { id: Focus; title: string; detail: string }[] = [
  { id: "ship", title: "Ship a launch", detail: "One product, a short list, a date." },
  { id: "day", title: "Run the workday", detail: "A hook, then the next honest task." },
  { id: "plan", title: "Keep a plan honest", detail: "Costs, risks, and what is actually done." },
];

export function freshWorkspace(): Workspace {
  return {
    onboarded: false,
    name: "",
    focus: "ship",
    reminderTime: "09:00",
    remindersOn: true,
    lastSeen: "",
    returnFrom: null,
    digestOn: null,
    dismissed: [],
    activeDays: [],
  };
}

export function focusLabel(focus: Focus): string {
  return FOCUS_OPTIONS.find((item) => item.id === focus)?.title ?? "Ship a launch";
}

export type DeskAlert = { id: string; title: string; detail: string };

export function buildAlerts(tasks: Task[], workspace: Workspace, now = new Date()): DeskAlert[] {
  const alerts: DeskAlert[] = [];
  const dismissed = new Set(workspace.dismissed);
  if (workspace.returnFrom && !dismissed.has("return")) {
    alerts.push({
      id: "return",
      title: "Welcome back",
      detail: `Last open day was ${workspace.returnFrom}. The hook is still the job.`,
    });
  }
  const overdue = tasks.filter((task) => task.status !== "done" && dueLabel(task.due)?.late);
  if (overdue.length > 0 && !dismissed.has("overdue")) {
    alerts.push({
      id: "overdue",
      title: overdue.length === 1 ? "One task is overdue" : `${overdue.length} tasks are overdue`,
      detail: overdue
        .slice(0, 3)
        .map((task) => task.title)
        .join(" · "),
    });
  }
  const hook = hookTask(tasks);
  const [hour, minute] = workspace.reminderTime.split(":").map((part) => Number(part));
  const pastReminder =
    Number.isFinite(hour) &&
    (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= (minute || 0)));
  if (workspace.remindersOn && pastReminder && hook && hook.status !== "done" && !dismissed.has("hook")) {
    alerts.push({
      id: "hook",
      title: `Past ${workspace.reminderTime}`,
      detail: `Still on the hook: ${hook.title}`,
    });
  }
  const finishedToday = tasks.some(
    (task) => task.completedAt !== null && localISODate(0, new Date(task.completedAt)) === localISODate(0, now),
  );
  if (workspace.remindersOn && pastReminder && !finishedToday && !dismissed.has("quiet")) {
    alerts.push({
      id: "quiet",
      title: "Nothing finished yet today",
      detail: "One completion is enough to keep the streak. The desk does not email you.",
    });
  }
  return alerts;
}

export function reminderBody(tasks: Task[]): string | null {
  const hook = hookTask(tasks);
  if (!hook || hook.status === "done") return null;
  return `Still on the hook: ${hook.title}`;
}
