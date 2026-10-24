import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { useKeel } from "./store.ts";
import { localISODate, openCount, packTasks, parseTaskInput, seedTasks, taskGroups } from "./data.ts";
import { buildAlerts } from "./workspace.ts";

beforeEach(() => useKeel.getState().reset());

test("task input captures relative dates across month boundaries and validates explicit dates", () => {
  assert.deepEqual(parseTaskInput("Email client tomorrow", new Date(2026, 0, 31, 12)), { title: "Email client", due: "2026-02-01" });
  assert.deepEqual(parseTaskInput("Email client due 2026-02-28"), { title: "Email client", due: "2026-02-28" });
  assert.deepEqual(parseTaskInput("Email client 2026-02-30"), { title: "Email client 2026-02-30", due: null });
  useKeel.getState().addTask("Email client tomorrow", "next");
  assert.equal(useKeel.getState().tasks[0].due, localISODate(1));
});

test("free cap blocks both reopening and starting completed tasks, then allows reopening after a completion", () => {
  const s = useKeel.getState();
  s.addTask("Eighth task", "next");
  for (const status of ["open", "doing"] as const) {
    s.setStatus("t-name", status);
    assert.equal(useKeel.getState().tasks.find(t => t.id === "t-name")?.status, "done");
    assert.equal(openCount(useKeel.getState().tasks), 8);
  }
  s.setStatus("t-mvp", "done");
  s.setStatus("t-name", "open");
  assert.equal(openCount(useKeel.getState().tasks), 8);
  assert.equal(useKeel.getState().tasks.find(t => t.id === "t-name")?.status, "open");
});

test("committed titles keep word separators and reject blank persistence", async () => {
  const s = useKeel.getState();
  s.patchTask("t-mvp", { title: "Logo proof" });
  for (const title of ["", "   "]) {
    s.patchTask("t-mvp", { title });
    assert.equal(useKeel.getState().tasks.find(t => t.id === "t-mvp")?.title, "Logo proof");
  }
  s.patchTask("t-mvp", { title: "  Logo proof revised  " });
  await useKeel.persist.rehydrate();
  assert.equal(useKeel.getState().tasks.find(t => t.id === "t-mvp")?.title, "Logo proof revised");
  assert.ok(packTasks(useKeel.getState().tasks).every(t => t.title.trim()));
});

test("each active task belongs to exactly one desk group", () => {
  for (const task of seedTasks().filter(t => t.status !== "done")) {
    assert.equal(taskGroups([task]).flatMap(g => g.items).length, 1);
  }
});

test("reapplying generated steps retains IDs and completion without duplicates", () => {
  const s = useKeel.getState();
  s.attachSteps("t-cap", [" Draft plan ", "Review plan"], "offline");
  const first = useKeel.getState().tasks.find(t => t.id === "t-cap")!.steps;
  s.toggleStep("t-cap", first[0].id);
  s.attachSteps("t-cap", ["Draft plan", "Review plan"], "offline");
  const second = useKeel.getState().tasks.find(t => t.id === "t-cap")!.steps;
  assert.equal(second.length, 2);
  assert.equal(second[0].id, first[0].id);
  assert.equal(second[0].done, true);
});

test("new day restores overdue alerts", () => {
  const s = useKeel.getState();
  s.patchTask("t-mvp", { due: localISODate(-2) });
  useKeel.setState({ workspace: { ...s.workspace, lastSeen: localISODate(-1), dismissed: ["overdue"] } });
  s.noteVisit();
  const current = useKeel.getState();
  assert.ok(buildAlerts(current.tasks, current.workspace).some(a => a.id === "overdue"));
});

test("request cap retains focused older or completed task", () => {
  const tasks = Array.from({ length: 20 }, (_, i) => ({ ...seedTasks()[0], id: `task-${i}` }));
  for (const status of ["open", "done"] as const) {
    tasks[19].status = status;
    const packed = packTasks(tasks, "task-19");
    assert.equal(packed.length, 16);
    assert.ok(packed.some(t => t.id === "task-19"));
    assert.equal(new Set(packed.map(t => t.id)).size, 16);
  }
});


test("local saving survives a store change and rehydration", async () => {
  const s = useKeel.getState();
  s.addTask("Persistence check", "next");
  const saved = localStorage.getItem("keel-v2");
  assert.ok(saved?.includes("Persistence check"));
  useKeel.setState({ tasks: [] });
  localStorage.setItem("keel-v2", saved!);
  await useKeel.persist.rehydrate();
  assert.ok(useKeel.getState().tasks.some(t => t.title === "Persistence check"));
});

test("step normalization handles mixed case, whitespace and truncation without changing completed steps", () => {
  const s = useKeel.getState();
  s.attachSteps("t-cap", [" Review plan ", "review plan", "", "   ", "REVIEW PLAN"], "offline");
  const first = useKeel.getState().tasks.find(t => t.id === "t-cap")!.steps;
  assert.equal(first.length, 1);
  s.toggleStep("t-cap", first[0].id);
  s.attachSteps("t-cap", ["review plan", "x".repeat(161), "x".repeat(160)], "offline");
  const steps = useKeel.getState().tasks.find(t => t.id === "t-cap")!.steps;
  assert.equal(steps.length, 2);
  assert.equal(steps[0].id, first[0].id);
  assert.equal(steps[0].done, true);
});

test("production assistant stays closed even with development opt-in", async () => {
  const { allowsUnmeteredAssistant } = await import("./assistant-policy.ts");
  assert.equal(allowsUnmeteredAssistant({ NODE_ENV: "production", KEEL_ALLOW_UNMETERED_AI: "true" }), false);
  assert.equal(allowsUnmeteredAssistant({ NODE_ENV: "development" }), false);
  assert.equal(allowsUnmeteredAssistant({}), false);
  assert.equal(allowsUnmeteredAssistant({ NODE_ENV: "development", KEEL_ALLOW_UNMETERED_AI: "true" }), true);
});

test("running clock refreshes midnight, reminders and trial expiry and cleans up", async (t) => {
  const { startKeelClock } = await import("./lifecycle.ts");
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalNotification = globalThis.Notification;
  Object.assign(globalThis, { window: new EventTarget(), document: new EventTarget() });
  let notices = 0;
  Object.assign(globalThis, { Notification: class { static permission = "granted"; constructor() { notices++; } } });
  t.mock.timers.enable({ apis: ["Date", "setInterval"], now: new Date(2026, 9, 23, 23, 59, 45).getTime() });
  const s = useKeel.getState();
  useKeel.setState({
    plan: "trial", trialEnds: Date.now() + 10_000,
    workspace: { ...s.workspace, onboarded: true, lastSeen: "2026-10-23", reminderTime: "00:01", digestOn: "2026-10-23", dismissed: ["overdue", "hook", "quiet"] },
  });
  let stop: (() => void) | undefined;
  try {
    stop = startKeelClock();
    t.mock.timers.tick(30_000);
    assert.equal(useKeel.getState().plan, "free");
    assert.equal(useKeel.getState().workspace.lastSeen, "2026-10-24");
    assert.ok(!useKeel.getState().workspace.dismissed.includes("overdue"));
    assert.equal(notices, 0);
    t.mock.timers.tick(60_000);
    assert.equal(notices, 1);
    t.mock.timers.tick(60_000);
    assert.equal(notices, 1);
    useKeel.setState({ plan: "trial", trialEnds: Date.now() - 1 });
    window.dispatchEvent(new Event("focus"));
    assert.equal(useKeel.getState().plan, "free");
    stop();
    useKeel.setState({ plan: "trial", trialEnds: Date.now() - 1 });
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
    t.mock.timers.tick(60_000);
    assert.equal(useKeel.getState().plan, "trial");
  } finally {
    stop?.();
    t.mock.timers.reset();
    Object.assign(globalThis, { window: originalWindow, document: originalDocument, Notification: originalNotification });
  }
});

test("rehydration repairs blank titles saved by earlier revisions without losing task data", async () => {
  const task = { ...seedTasks()[0], title: "   ", notes: "Keep this context" };
  localStorage.setItem("keel-v2", JSON.stringify({ state: { tasks: [task] }, version: 0 }));
  await useKeel.persist.rehydrate();
  assert.equal(useKeel.getState().tasks[0].title, "Untitled task");
  assert.equal(useKeel.getState().tasks[0].notes, task.notes);
  assert.equal(useKeel.getState().tasks[0].id, task.id);
});

test("first visit without saved state retains seed tasks", async () => {
  localStorage.removeItem("keel-v2");
  await useKeel.persist.rehydrate();
  assert.equal(useKeel.getState().tasks.length, seedTasks().length);
});
