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

test("controlled title edits retain word separators", () => {
  for (const title of ["Logo", "Logo ", "Logo p", "Logo proof"]) {
    useKeel.getState().patchTask("t-mvp", { title });
    assert.equal(useKeel.getState().tasks.find(t => t.id === "t-mvp")?.title, title);
  }
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
