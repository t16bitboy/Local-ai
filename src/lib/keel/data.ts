export type Priority = "now" | "next" | "later";
export type Status = "open" | "doing" | "done";
export type Plan = "free" | "trial" | "pro";
export type ViewId = "desk" | "brief" | "pulse" | "ops" | "guide";
export type RiskState = "open" | "watching" | "mitigated";
export type MilestoneState = "queued" | "building" | "shipped";

export type Step = { id: string; title: string; done: boolean; mark?: Mark | null };

export type Task = {
  id: string;
  title: string;
  notes: string;
  steps: Step[];
  status: Status;
  priority: Priority;
  due: string | null;
  assist: "none" | "model" | "offline";
  titleMark?: Mark | null;
  createdAt: number;
  completedAt: number | null;
};

export type AssistPayload = {
  steps: string[] | null;
  focusId: string | null;
  rewrites: { id: string; title: string }[] | null;
};

export type Turn =
  | { id: string; kind: "you"; text: string; at: number }
  | { id: string; kind: "model"; text: string; at: number; model: string; payload: AssistPayload; mark?: Mark }
  | { id: string; kind: "offline"; text: string; at: number; payload: AssistPayload }
  | { id: string; kind: "error"; text: string; at: number };

export const FREE_OPEN_CAP = 8;
export const FREE_AI_CAP = 3;
export const PAID_AI_CAP = 12;
export const TRIAL_MS = 7 * 24 * 60 * 60 * 1000;

export const VIEWS: { id: ViewId; label: string }[] = [
  { id: "desk", label: "Desk" },
  { id: "brief", label: "Brief" },
  { id: "pulse", label: "Pulse" },
  { id: "ops", label: "Ops" },
  { id: "guide", label: "Guide" },
];

export type Risk = { id: string; title: string; mitigation: string; state: RiskState };
export type Milestone = {
  id: string;
  title: string;
  when: string;
  priority: string;
  state: MilestoneState;
};
export type Rule = { id: string; label: string; checked: boolean };

export function localISODate(offset = 0, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function localKey(ts: number): string {
  return localISODate(0, new Date(ts));
}

export type Mark = {
  schema: "ai-act-50-2";
  synthetic: true;
  method: "model";
  model: string;
  id: string;
};

export function uid(): string {
  return crypto.randomUUID();
}

export function aiMark(model: string): Mark {
  return { schema: "ai-act-50-2", synthetic: true, method: "model", model, id: uid() };
}

export function markToken(mark: Mark): string {
  return `keel:ai:50-2:${mark.method}:${mark.model}:${mark.id}`;
}

export function emptyPayload(): AssistPayload {
  return { steps: null, focusId: null, rewrites: null };
}

function daysAgo(n: number): number {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(15, 0, 0, 0);
  return d.getTime();
}

function step(title: string): Step {
  return { id: uid(), title, done: false, mark: null };
}

export function seedTasks(): Task[] {
  const today = localISODate(0);
  const soon = localISODate(2);
  const week = localISODate(4);
  return [
    {
      id: "t-mvp",
      title: "Ship the core desk",
      notes: "Month 1, Q4 2026. The free tier has to be worth opening before anyone is asked to pay.",
      steps: [
        step("Keep one task on the hook"),
        step("Show the free cap before it blocks"),
        step("Let a finished task clear room for a new one"),
      ],
      status: "doing",
      priority: "now",
      due: today,
      assist: "none",
      createdAt: daysAgo(6),
      completedAt: null,
    },
    {
      id: "t-label",
      title: "Label every assistant reply",
      notes: "The EU AI Act expects people to know when text was generated, and to be able to turn the assistant off.",
      steps: [],
      status: "open",
      priority: "now",
      due: today,
      assist: "none",
      createdAt: daysAgo(5),
      completedAt: null,
    },
    {
      id: "t-cap",
      title: "Hold free assists to three a day",
      notes: "Three is enough to feel the assistant. The fourth call is the upgrade moment, not a wall on the first screen.",
      steps: [],
      status: "open",
      priority: "next",
      due: localISODate(1),
      assist: "none",
      createdAt: daysAgo(5),
      completedAt: null,
    },
    {
      id: "t-budget",
      title: "Correct the inference budget",
      notes:
        "The memo prices 50k tokens/day on GPT-4 Turbo at $0.03/1k as about $45/day. Check that arithmetic in Ops before anyone budgets it.",
      steps: [],
      status: "open",
      priority: "next",
      due: soon,
      assist: "none",
      createdAt: daysAgo(4),
      completedAt: null,
    },
    {
      id: "t-privacy",
      title: "Review privacy rules before anyone else uses this",
      notes:
        "The breach case in the plan is unauthorized data access. This build keeps tasks in the browser and sends the assistant only titles you choose to send.",
      steps: [],
      status: "open",
      priority: "next",
      due: week,
      assist: "none",
      createdAt: daysAgo(4),
      completedAt: null,
    },
    {
      id: "t-handoff",
      title: "Design the calendar and Slack handoff",
      notes: "Month 4–5. Not in this build. The guide says so, so the desk does not pretend the integration exists.",
      steps: [],
      status: "open",
      priority: "later",
      due: null,
      assist: "none",
      createdAt: daysAgo(3),
      completedAt: null,
    },
    {
      id: "t-ocr",
      title: "Decide whether image and OCR belong in v1",
      notes: "Month 6 stretch. Easy to overbuild while the core desk is still the job.",
      steps: [],
      status: "open",
      priority: "later",
      due: null,
      assist: "none",
      createdAt: daysAgo(3),
      completedAt: null,
    },
    {
      id: "t-name",
      title: "Name the product and lock the palette",
      notes: "Keel. Ink, paper, copper.",
      steps: [],
      status: "done",
      priority: "now",
      due: null,
      assist: "none",
      createdAt: daysAgo(8),
      completedAt: daysAgo(2),
    },
    {
      id: "t-risks",
      title: "Write the four launch risks in plain language",
      notes: "Conversion, breach, provider changes, compliance.",
      steps: [],
      status: "done",
      priority: "next",
      due: null,
      assist: "none",
      createdAt: daysAgo(7),
      completedAt: daysAgo(1),
    },
    {
      id: "t-path",
      title: "Sketch the path from desk to brief to pulse",
      notes: "One primary action per view.",
      steps: [],
      status: "done",
      priority: "next",
      due: null,
      assist: "none",
      createdAt: daysAgo(7),
      completedAt: daysAgo(3),
    },
    {
      id: "t-guide",
      title: "Outline the in-app guide",
      notes: "Say what is real and what is still on the roadmap.",
      steps: [],
      status: "done",
      priority: "later",
      due: null,
      assist: "none",
      createdAt: daysAgo(6),
      completedAt: daysAgo(4),
    },
    {
      id: "t-phone",
      title: "Check the desk at phone width",
      notes: "Thumb reach, no sideways scroll.",
      steps: [],
      status: "done",
      priority: "next",
      due: null,
      assist: "none",
      createdAt: daysAgo(6),
      completedAt: daysAgo(5),
    },
    {
      id: "t-route",
      title: "Pick a live model and keep the others as fallbacks",
      notes: "Grok is connected. GPT, DeepSeek, and Anthropic stay on the router as unwired routes.",
      steps: [],
      status: "done",
      priority: "now",
      due: null,
      assist: "none",
      createdAt: daysAgo(9),
      completedAt: daysAgo(6),
    },
  ];
}

export function seedRisks(): Risk[] {
  return [
    {
      id: "convert",
      title: "Free users don’t convert",
      mitigation:
        "The free desk has to be useful on its own, and the paid line has to be obvious at the moment of need: the ninth open task, the fourth assist, the full-board rewrite. A 7-day trial sits there. Partner bundles wait for calendar and Slack.",
      state: "watching",
    },
    {
      id: "breach",
      title: "A logic hole exposes data",
      mitigation:
        "Tasks stay in this browser. The assistant receives titles only when you send them, never on a timer. There is no shared database and no bulk wipe. The privacy checklist below is the review, not a substitute for an audit before real customer data.",
      state: "watching",
    },
    {
      id: "vendor",
      title: "A model provider changes price or endpoint",
      mitigation:
        "One live route today: Grok. The other providers in the memo stay listed with their cost notes so the call site can switch without a rewrite. DeepSeek V4 Pro was noted at about 12× less than GPT if inference cost gets away from us.",
      state: "watching",
    },
    {
      id: "law",
      title: "Rules for chatbots move",
      mitigation:
        "Article 50 transparency has applied since 2 August 2026. The high-risk rules were deferred. Brief says you are talking to an AI system before the first send. Model replies, attached steps, and rewritten titles carry a machine-readable mark (keel:ai:50-2). The assistant can be switched off.",
      state: "mitigated",
    },
  ];
}

export function seedMilestones(): Milestone[] {
  return [
    { id: "mvp", title: "Core desk", when: "Month 1 · Q4 2026", priority: "High", state: "building" },
    { id: "assistant", title: "AI task assistant", when: "Month 2–3", priority: "High", state: "building" },
    { id: "beta", title: "Mobile and web beta", when: "Month 2–3", priority: "High", state: "building" },
    { id: "integrations", title: "Calendar and Slack", when: "Month 4–5", priority: "Medium", state: "queued" },
    { id: "analytics", title: "Analytics", when: "Month 5", priority: "Medium", state: "building" },
    { id: "i18n", title: "Internationalization", when: "Month 6", priority: "Low", state: "queued" },
    { id: "vision", title: "OCR and image", when: "Month 6+", priority: "Stretch", state: "queued" },
  ];
}

export function seedRules(): Rule[] {
  return [
    { id: "local", label: "Tasks and notes stay in this browser", checked: true },
    { id: "initiated", label: "Model calls happen only when someone presses send", checked: true },
    { id: "titles", label: "The assistant is sent titles and status, not a silent export", checked: true },
    { id: "label", label: "Generated replies are labeled, including the model name", checked: true },
    { id: "mark", label: "Model text carries a machine-readable Article 50 mark", checked: true },
    { id: "optout", label: "The assistant can be turned off without losing the desk", checked: true },
    { id: "audit", label: "A human audit is still required before customer data", checked: false },
  ];
}

export type RouteRow = {
  id: string;
  name: string;
  state: "live" | "standby";
  note: string;
};

export const ROUTES: RouteRow[] = [
  {
    id: "grok",
    name: "Grok 4.5",
    state: "live",
    note: "The only connected route. Calls are capped and start from a button.",
  },
  {
    id: "gpt",
    name: "GPT-4 Turbo",
    state: "standby",
    note: "Memo price $0.03 / 1k tokens. Not wired. Used as the budget example in Ops.",
  },
  {
    id: "deepseek",
    name: "DeepSeek V4 Pro",
    state: "standby",
    note: "Memo notes about 12× lower cost than GPT. The spare route if inference dominates.",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    state: "standby",
    note: "Listed as a cheaper-per-query option. No key, no calls.",
  },
];

export const MEMO_TOKENS_PER_DAY = 50_000;
export const MEMO_DOLLARS_PER_1K = 0.03;
export const MEMO_CLAIMED_PER_DAY = 45;
export const PLATFORM_LOW = 100;
export const PLATFORM_HIGH = 300;
export const HOSTING = 30;
export const PLUGINS = 50;
export const DOMAIN_YEAR = 10;

export function inferenceCost(tokensPerDay: number, dollarsPer1k: number) {
  const safeTokens = Number.isFinite(tokensPerDay) ? Math.max(0, tokensPerDay) : 0;
  const safeRate = Number.isFinite(dollarsPer1k) ? Math.max(0, dollarsPer1k) : 0;
  const perDay = (safeTokens / 1000) * safeRate;
  return { perDay, perMonth: perDay * 30 };
}

export function money(n: number): string {
  if (n >= 100) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function dueLabel(due: string | null): { text: string; late: boolean } | null {
  if (!due) return null;
  const today = localISODate(0);
  if (due < today) return { text: "Overdue", late: true };
  if (due === today) return { text: "Today", late: false };
  if (due === localISODate(1)) return { text: "Tomorrow", late: false };
  const d = new Date(`${due}T12:00:00`);
  return {
    text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    late: false,
  };
}

export function hookTask(tasks: Task[]): Task | undefined {
  return (
    tasks.find((t) => t.status === "doing") ??
    tasks.find((t) => t.status === "open" && t.priority === "now") ??
    tasks.find((t) => t.status !== "done")
  );
}

export function openCount(tasks: Task[]): number {
  return tasks.filter((t) => t.status !== "done").length;
}

export function aiCap(plan: Plan): number {
  return plan === "free" ? FREE_AI_CAP : PAID_AI_CAP;
}

export function weekBars(tasks: Task[]): { label: string; done: number }[] {
  const bars: { label: string; done: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const key = localISODate(-i);
    const label = new Date(`${key}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
    const done = tasks.filter((t) => t.completedAt !== null && localKey(t.completedAt) === key).length;
    bars.push({ label, done });
  }
  return bars;
}

export type PackedTask = {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  due: string | null;
};

export function packTasks(tasks: Task[], focusId: string | null = null): PackedTask[] {
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done").slice(0, 4);
  const focus = tasks.find((t) => t.id === focusId);
  const ordered = focus ? [focus, ...open.filter((t) => t.id !== focusId), ...done.filter((t) => t.id !== focusId)] : [...open, ...done];
  return ordered.slice(0, 16).map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    due: t.due,
  }));
}

export function offlineDraft(
  prompt: string,
  tasks: PackedTask[],
  focusId: string | null,
): { text: string; payload: AssistPayload } {
  const open = tasks.filter((t) => t.status !== "done");
  const focus = tasks.find((t) => t.id === focusId) ?? open[0];
  const q = prompt.toLowerCase();
  const payload = emptyPayload();

  if ((/break|step|split/.test(q) || /hook/.test(q)) && focus) {
    payload.steps = [
      `Write down what “done” means for “${focus.title}”`,
      "Do the smallest visible piece in one sitting",
      "Leave a note on what is still open",
    ];
    payload.focusId = focus.id;
    return {
      text: `Offline draft for “${focus.title}”. These steps are a template, not a model reply. They will be marked that way if you attach them.`,
      payload,
    };
  }

  if (/rewrite|retitle/.test(q)) {
    return {
      text: "Rewriting the board needs the live model. This offline draft will not invent new titles and pretend they were edited.",
      payload,
    };
  }

  if (open.length === 0) {
    return {
      text: "Nothing is open. Add a task on the desk, then ask again. This is an offline draft, not a model reply.",
      payload,
    };
  }

  const ranked = [...open].sort((a, b) => {
    const rank = { now: 0, next: 1, later: 2 };
    const byP = rank[a.priority] - rank[b.priority];
    if (byP !== 0) return byP;
    if (a.status === "doing" && b.status !== "doing") return -1;
    if (b.status === "doing" && a.status !== "doing") return 1;
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });
  payload.focusId = ranked[0]?.id ?? null;
  const lines = ranked
    .slice(0, 5)
    .map((t, i) => `${i + 1}. ${t.title}${t.due ? ` (${dueLabel(t.due)?.text ?? t.due})` : ""}`)
    .join(" ");
  return {
    text: `Offline order, not a model reply. Do these in sequence: ${lines}`,
    payload,
  };
}

// Interpret only explicit trailing date phrases. Leave ambiguous text intact.
export function parseTaskInput(input: string, now = new Date()): { title: string; due: string | null } {
  const clean = input.trim();
  const relative = clean.match(/\s+(?:due\s+)?(today|tomorrow)$/i);
  if (relative) {
    return { title: clean.slice(0, relative.index).trim(), due: localISODate(relative[1].toLowerCase() === "tomorrow" ? 1 : 0, now) };
  }
  const explicit = clean.match(/\s+(?:due\s+)?(\d{4}-\d{2}-\d{2})$/);
  if (explicit) {
    const date = new Date(`${explicit[1]}T12:00:00`);
    if (!Number.isNaN(date.getTime()) && localISODate(0, date) === explicit[1]) {
      return { title: clean.slice(0, explicit.index).trim(), due: explicit[1] };
    }
  }
  return { title: clean, due: null };
}

export function taskGroups(tasks: Task[]) {
  return [
    { label: "In motion", items: tasks.filter((t) => t.status === "doing") },
    ...(["now", "next", "later"] as Priority[]).map((priority) => ({
      label: priority[0].toUpperCase() + priority.slice(1),
      items: tasks.filter((t) => t.status === "open" && t.priority === priority),
    })),
  ];
}
