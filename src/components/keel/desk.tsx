import { useState } from "react";
import { dueLabel, taskGroups, hookTask, markToken, openCount, type Priority, type Task, FREE_OPEN_CAP } from "@/lib/keel/data";
import { useKeel } from "@/lib/keel/store";
import { TaskDetail } from "@/components/keel/task-detail";
import { Button } from "@/components/keel/ui";

const priorities: { id: Priority; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "next", label: "Next" },
  { id: "later", label: "Later" },
];

export function Desk() {
  const tasks = useKeel((s) => s.tasks);
  const plan = useKeel((s) => s.plan);
  const selectedId = useKeel((s) => s.selectedId);
  const select = useKeel((s) => s.select);
  const addTask = useKeel((s) => s.addTask);
  const setStatus = useKeel((s) => s.setStatus);
  const workspace = useKeel((s) => s.workspace);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("next");
  const [showDone, setShowDone] = useState(false);
  const [sheet, setSheet] = useState(false);

  const hook = hookTask(tasks);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const open = openCount(tasks);
  const listed = tasks.filter((t) => t.id !== hook?.id && t.status !== "done");
  const groups = taskGroups(listed);
  const done = tasks.filter((t) => t.status === "done");

  function openTask(id: string) {
    select(id);
    setSheet(true);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-5">
        {hook ? (
          <section className="rounded-lg bg-paper p-5 text-ink">
            <p className="text-sm font-semibold tracking-wide text-ink/60 uppercase">On the hook</p>
            <h2 className="mt-1 text-3xl leading-tight">{hook.title}</h2>
            <p className="mt-2 text-base text-ink/75">
              {hook.notes || "This is the one piece of work the desk is willing to shout about."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {hook.status !== "done" ? (
                <Button variant="ink" onClick={() => setStatus(hook.id, "done")}>
                  Finish it
                </Button>
              ) : null}
              <Button
                variant="line"
                className="bg-paper text-ink"
                onClick={() => openTask(hook.id)}
              >
                Open
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-lg bg-paper p-5 text-ink">
            <h2 className="text-3xl">The desk is clear</h2>
            <p className="mt-2 text-ink/75">Add the next real piece of work. Empty is a fine state.</p>
          </section>
        )}

        <p className="text-sm font-semibold tracking-wide text-muted uppercase">
          {workspace.name ? `${workspace.name} · ` : ""}
          {workspace.activeDays.length} active day{workspace.activeDays.length === 1 ? "" : "s"}
          {workspace.remindersOn ? ` · nudge at ${workspace.reminderTime}` : ""}
        </p>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            const result = addTask(title, priority);
            if (result === "added") setTitle("");
          }}
        >
          <label className="sr-only" htmlFor="new-task">
            New task
          </label>
          <input
            id="new-task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task in plain language"
            maxLength={140}
            className="min-h-12 w-full rounded-md bg-surface px-4 text-base text-fg shadow-line placeholder:text-muted"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md bg-surface p-1 shadow-line" role="group" aria-label="Priority">
              {priorities.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPriority(item.id)}
                  className={
                    priority === item.id
                      ? "min-h-11 rounded-sm bg-copper px-3 font-semibold text-ink"
                      : "min-h-11 rounded-sm px-3 text-muted"
                  }
                  aria-pressed={priority === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button type="submit">Add</Button>
            <p className="text-sm text-muted tabular-nums">
              {plan === "free" ? `${open} of ${FREE_OPEN_CAP} open on Free` : `${open} open`}
            </p>
          </div>
        </form>

        {groups.map((group) =>
          group.items.length === 0 ? null : (
            <section key={group.label} className="flex flex-col">
              <h3 className="mb-1 text-lg">{group.label}</h3>
              <ul className="flex flex-col divide-y divide-line">
                {group.items.map((task) => (
                  <TaskRow key={task.id} task={task} onOpen={() => openTask(task.id)} />
                ))}
              </ul>
            </section>
          ),
        )}

        {done.length > 0 ? (
          <section>
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              className="min-h-11 text-base font-semibold text-muted"
            >
              {showDone ? "Hide" : "Show"} done ({done.length})
            </button>
            {showDone ? (
              <ul className="flex flex-col divide-y divide-line">
                {done.map((task) => (
                  <TaskRow key={task.id} task={task} onOpen={() => openTask(task.id)} />
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
      </div>

      <aside className="sticky top-20 hidden rounded-lg bg-surface p-5 shadow-line lg:block">
        {selected ? (
          <TaskDetail task={selected} />
        ) : (
          <p className="text-muted">Select a task to edit notes, due date, and steps.</p>
        )}
      </aside>

      {sheet && selected ? (
        <div
        className="fixed inset-0 z-30 flex items-end bg-bg/80 lg:hidden"
        onClick={() => setSheet(false)}
      >
        <div
          className="max-h-[88dvh] w-full overflow-y-auto rounded-t-xl bg-surface p-5 shadow-line"
          onClick={(e) => e.stopPropagation()}
        >
            <TaskDetail task={selected} onClose={() => setSheet(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TaskRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const setStatus = useKeel((s) => s.setStatus);
  const due = dueLabel(task.due);
  const doneSteps = task.steps.filter((s) => s.done).length;
  return (
    <li className="flex items-center gap-2 py-1">
      <button
        type="button"
        aria-label={task.status === "done" ? `Reopen ${task.title}` : `Finish ${task.title}`}
        onClick={() => setStatus(task.id, task.status === "done" ? "open" : "done")}
        className="grid size-11 shrink-0 place-items-center"
      >
        <span
          className={
            task.status === "done"
              ? "grid size-5 place-items-center rounded-full bg-copper text-xs text-ink"
              : "size-5 rounded-full shadow-line"
          }
        >
          {task.status === "done" ? "✓" : ""}
        </span>
      </button>
      <button
        type="button"
        onClick={onOpen}
        data-ai-synthetic={task.titleMark ? "true" : undefined}
        data-ai-schema={task.titleMark?.schema}
        data-ai-model={task.titleMark?.model}
        data-ai-mark={task.titleMark ? markToken(task.titleMark) : undefined}
        className="min-h-11 min-w-0 flex-1 py-2 text-left"
      >
        <span className={task.status === "done" ? "block text-muted line-through" : "block text-fg"}>
          {task.title}
        </span>
        <span className="mt-0.5 flex gap-2 text-sm text-muted">
          {due ? <span className={due.late ? "text-copper" : ""}>{due.text}</span> : null}
          {task.steps.length > 0 ? (
            <span className="tabular-nums">
              {doneSteps}/{task.steps.length} steps
            </span>
          ) : null}
          {task.assist === "model" ? <span>Grok</span> : null}
          {task.assist === "offline" ? <span>Offline draft</span> : null}
        </span>
      </button>
    </li>
  );
}
