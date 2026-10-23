import { create } from "zustand";
import { persist } from "zustand/middleware";
import { freshWorkspace, reminderBody, type Focus, type Workspace } from "@/lib/keel/workspace";
import {
  type AssistPayload,
  type Milestone,
  type Plan,
  type Priority,
  type Risk,
  type Rule,
  type Status,
  type Task,
  type Turn,
  type ViewId,
  FREE_OPEN_CAP,
  TRIAL_MS,
  aiCap,
  localISODate,
  parseTaskInput,
  openCount,
  seedMilestones,
  seedRisks,
  seedRules,
  seedTasks,
  uid,
  aiMark,
} from "@/lib/keel/data";

type KeelState = {
  tasks: Task[];
  plan: Plan;
  trialEnds: number | null;
  aiEnabled: boolean;
  aiUses: { date: string; count: number };
  turns: Turn[];
  risks: Risk[];
  milestones: Milestone[];
  rules: Rule[];
  coachDismissed: boolean;
  gateHits: number;
  assistCount: number;
  workspace: Workspace;
  view: ViewId;
  selectedId: string | null;
  upgradeReason: string | null;
  setView: (view: ViewId) => void;
  select: (id: string | null) => void;
  dismissCoach: () => void;
  openUpgrade: (reason: string, countGate?: boolean) => void;
  closeUpgrade: () => void;
  setPlan: (plan: Plan) => void;
  startTrial: () => void;
  setAiEnabled: (on: boolean) => void;
  usesToday: () => number;
  addTask: (title: string, priority: Priority) => "added" | "capped";
  patchTask: (id: string, patch: Partial<Pick<Task, "title" | "notes" | "priority" | "due">>) => void;
  setStatus: (id: string, status: Status) => void;
  toggleStep: (taskId: string, stepId: string) => void;
  removeTask: (id: string) => void;
  attachSteps: (taskId: string, titles: string[], via: "model" | "offline", model?: string | null) => void;
  applyRewrites: (rows: { id: string; title: string }[], via: "model" | "offline", model?: string | null) => void;
  pushTurn: (turn: Turn) => void;
  recordAssist: () => boolean;
  setRisk: (id: string, state: Risk["state"]) => void;
  setMilestone: (id: string, state: Milestone["state"]) => void;
  toggleRule: (id: string) => void;
  finishOnboarding: (input: { name: string; focus: Focus; reminderTime: string; remindersOn: boolean }) => void;
  patchWorkspace: (patch: Partial<Pick<Workspace, "name" | "focus" | "reminderTime" | "remindersOn">>) => void;
  dismissAlert: (id: string) => void;
  noteVisit: () => void;
  reset: () => void;
};

function usesOn(aiUses: { date: string; count: number }): number {
  return aiUses.date === localISODate() ? aiUses.count : 0;
}

const dataDefaults = () => ({
  tasks: seedTasks(),
  plan: "free" as Plan,
  trialEnds: null as number | null,
  aiEnabled: true,
  aiUses: { date: localISODate(), count: 0 },
  turns: [] as Turn[],
  risks: seedRisks(),
  milestones: seedMilestones(),
  rules: seedRules(),
  coachDismissed: false,
  gateHits: 0,
  assistCount: 0,
  workspace: freshWorkspace(),
});

export const useKeel = create<KeelState>()(
  persist(
    (set, get) => ({
      ...dataDefaults(),
      view: "desk",
      selectedId: "t-mvp",
      upgradeReason: null,
      setView: (view) => set({ view }),
      select: (selectedId) => set({ selectedId }),
      dismissCoach: () => set({ coachDismissed: true }),
      openUpgrade: (upgradeReason: string, countGate = false) =>
        set((s) => ({ upgradeReason, gateHits: countGate ? s.gateHits + 1 : s.gateHits })),
      closeUpgrade: () => set({ upgradeReason: null }),
      setPlan: (plan) => set({ plan, trialEnds: plan === "trial" ? get().trialEnds : null }),
      startTrial: () => set({ plan: "trial", trialEnds: Date.now() + TRIAL_MS, upgradeReason: null }),
      setAiEnabled: (aiEnabled) => set({ aiEnabled }),
      usesToday: () => usesOn(get().aiUses),
      addTask: (title, priority) => {
        const { title: clean, due } = parseTaskInput(title);
        if (!clean) return "added";
        if (get().plan === "free" && openCount(get().tasks) >= FREE_OPEN_CAP) {
          get().openUpgrade(
            `Free holds ${FREE_OPEN_CAP} open tasks. Finish one, or start the trial to keep adding.`,
            true,
          );
          return "capped";
        }
        const task: Task = {
          id: uid(),
          title: clean.slice(0, 140),
          notes: "",
          steps: [],
          status: "open",
          priority,
          due,
          assist: "none",
          createdAt: Date.now(),
          completedAt: null,
        };
        set((s) => ({ tasks: [task, ...s.tasks], selectedId: task.id }));
        return "added";
      },
      patchTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...patch,
                  title: patch.title !== undefined ? patch.title.slice(0, 140) : t.title,
                  titleMark: patch.title !== undefined && patch.title !== t.title ? null : t.titleMark,
                }
              : t,
          ),
        })),
      setStatus: (id, status) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task || task.status === status) return;
        if (task.status === "done" && status !== "done" && state.plan === "free" && openCount(state.tasks) >= FREE_OPEN_CAP) {
          state.openUpgrade(`Free holds ${FREE_OPEN_CAP} open tasks. Finish one before reopening another.`, true);
          return;
        }
        set((s) => {
          const today = localISODate();
          const finished = status === "done";
          const activeDays =
            finished && !s.workspace.activeDays.includes(today)
              ? [...s.workspace.activeDays, today].slice(-30)
              : s.workspace.activeDays;
          return {
            tasks: s.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status,
                    completedAt: finished ? Date.now() : null,
                  }
                : t,
            ),
            workspace: { ...s.workspace, activeDays },
          };
        });
      },
      toggleStep: (taskId, stepId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  steps: t.steps.map((step) => (step.id === stepId ? { ...step, done: !step.done } : step)),
                }
              : t,
          ),
        })),
      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),
      attachSteps: (taskId, titles, via, model?: string | null) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  assist: via,
                  steps: [
                    ...t.steps,
                    ...Array.from(new Set(titles.map((title) => title.trim().slice(0, 160)).filter(Boolean)))
                      .filter((title) => !t.steps.some((step) => step.title.toLowerCase() === title.toLowerCase()))
                      .slice(0, 6).map((title) => ({
                      id: uid(),
                      title: title.slice(0, 160),
                      done: false,
                      mark: via === "model" && model ? aiMark(model) : null,
                    })),
                  ],
                }
              : t,
          ),
        })),
      applyRewrites: (rows, via, model?: string | null) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            const next = rows.find((r) => r.id === t.id);
            if (!next) return t;
            const title = next.title.trim().slice(0, 140);
            if (!title || title === t.title) return t;
            return {
              ...t,
              title,
              assist: via,
              titleMark: via === "model" && model ? aiMark(model) : null,
            };
          }),
        })),
      pushTurn: (turn) => set((s) => ({ turns: [...s.turns, turn].slice(-24) })),
      recordAssist: () => {
        const cap = aiCap(get().plan);
        const used = usesOn(get().aiUses);
        if (used >= cap) {
          get().openUpgrade(
            get().plan === "free"
              ? `Three assists are included today. The trial lifts the cap to ${PAID_LABEL}.`
              : "Today’s assist cap is spent. It resets tomorrow.",
            true,
          );
          return false;
        }
        const date = localISODate();
        set((s) => ({
          aiUses: { date, count: (s.aiUses.date === date ? s.aiUses.count : 0) + 1 },
          assistCount: s.assistCount + 1,
        }));
        return true;
      },
      setRisk: (id, state) =>
        set((s) => ({ risks: s.risks.map((r) => (r.id === id ? { ...r, state } : r)) })),
      setMilestone: (id, state) =>
        set((s) => ({
          milestones: s.milestones.map((m) => (m.id === id ? { ...m, state } : m)),
        })),
      toggleRule: (id) =>
        set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r)) })),
      finishOnboarding: ({ name, focus, reminderTime, remindersOn }) =>
        set((s) => ({
          coachDismissed: true,
          workspace: {
            ...s.workspace,
            onboarded: true,
            name,
            focus,
            reminderTime: reminderTime || "09:00",
            remindersOn,
          },
        })),
      patchWorkspace: (patch) => set((s) => ({ workspace: { ...s.workspace, ...patch } })),
      dismissAlert: (id) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            dismissed: s.workspace.dismissed.includes(id) ? s.workspace.dismissed : [...s.workspace.dismissed, id],
            returnFrom: id === "return" ? null : s.workspace.returnFrom,
          },
        })),
      noteVisit: () => {
        const today = localISODate();
        const ws = get().workspace;
        const comingBack = ws.lastSeen !== "" && ws.lastSeen < today;
        const next: Workspace = {
          ...ws,
          lastSeen: today,
          returnFrom: comingBack ? ws.lastSeen : ws.returnFrom,
          dismissed: comingBack ? ws.dismissed.filter((id) => id !== "return" && id !== "hook" && id !== "quiet" && id !== "overdue") : ws.dismissed,
        };
        set({ workspace: next });
        if (!next.onboarded || !next.remindersOn || next.digestOn === today) return;
        if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
        const [hour, minute] = next.reminderTime.split(":").map((part) => Number(part));
        const now = new Date();
        const past =
          Number.isFinite(hour) &&
          (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= (minute || 0)));
        const body = reminderBody(get().tasks);
        if (!past || !body) return;
        try {
          new Notification("Keel", { body });
        } catch {
          return;
        }
        set({ workspace: { ...get().workspace, digestOn: today } });
      },
      reset: () =>
        set({
          ...dataDefaults(),
          view: "desk",
          selectedId: "t-mvp",
          upgradeReason: null,
        }),
    }),
    {
      name: "keel-v2",
      skipHydration: true,
      partialize: (s) => ({
        tasks: s.tasks,
        plan: s.plan,
        trialEnds: s.trialEnds,
        aiEnabled: s.aiEnabled,
        aiUses: s.aiUses,
        turns: s.turns,
        risks: s.risks,
        milestones: s.milestones,
        rules: s.rules,
        coachDismissed: s.coachDismissed,
        gateHits: s.gateHits,
        assistCount: s.assistCount,
        workspace: s.workspace,
      }),
    },
  ),
);

const PAID_LABEL = "12";

export function planLabel(plan: Plan, trialEnds: number | null): string {
  if (plan === "pro") return "Pro preview";
  if (plan === "trial" && trialEnds) {
    const days = Math.max(0, Math.ceil((trialEnds - Date.now()) / (24 * 60 * 60 * 1000)));
    return days === 1 ? "Trial · 1 day" : `Trial · ${days} days`;
  }
  if (plan === "trial") return "Trial";
  return "Free";
}

export type { AssistPayload };
