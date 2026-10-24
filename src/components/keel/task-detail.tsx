import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { dueLabel, markToken, type Task } from "@/lib/keel/data";
import { useKeel } from "@/lib/keel/store";
import { Button, FieldLabel } from "@/components/keel/ui";

export function TaskDetail({ task, onClose }: { task: Task; onClose?: () => void }) {
  const patchTask = useKeel((s) => s.patchTask);
  const setStatus = useKeel((s) => s.setStatus);
  const toggleStep = useKeel((s) => s.toggleStep);
  const removeTask = useKeel((s) => s.removeTask);
  const setView = useKeel((s) => s.setView);
  const [armDelete, setArmDelete] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  useEffect(() => {
    setTitleDraft(task.title);
    setArmDelete(false);
  }, [task.id, task.title]);
  const commitTitle = () => {
    const title = titleDraft.trim().slice(0, 140) || task.title;
    patchTask(task.id, { title });
    setTitleDraft(title);
  };
  const due = dueLabel(task.due);
  const doneSteps = task.steps.filter((s) => s.done).length;

  return (
    <article className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">
            {task.status === "done" ? "Done" : task.status === "doing" ? "In motion" : "Open"}
            {due ? ` · ${due.text}` : ""}
          </p>
          {task.assist !== "none" ? (
            <p className="mt-1 text-sm text-copper">
              {task.assist === "model" ? "Touched by Grok" : "Touched by an offline draft"}
              {task.titleMark ? ` · ${markToken(task.titleMark)}` : ""}
            </p>
          ) : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-md text-fg hover:bg-surface-2"
            aria-label="Close task"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      <input
        aria-label="Task title"
        value={titleDraft}
        maxLength={140}
        onChange={(e) => setTitleDraft(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setTitleDraft(task.title);
        }}
        data-ai-synthetic={task.titleMark ? "true" : undefined}
        data-ai-schema={task.titleMark?.schema}
        data-ai-model={task.titleMark?.model}
        data-ai-mark={task.titleMark ? markToken(task.titleMark) : undefined}
        className="w-full bg-transparent font-display text-2xl leading-tight text-fg outline-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="priority">Priority</FieldLabel>
          <select
            id="priority"
            value={task.priority}
            onChange={(e) => patchTask(task.id, { priority: e.target.value as Task["priority"] })}
            className="min-h-11 rounded-md bg-surface-2 px-3 text-fg"
          >
            <option value="now">Now</option>
            <option value="next">Next</option>
            <option value="later">Later</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="due">Due</FieldLabel>
          <input
            id="due"
            type="date"
            value={task.due ?? ""}
            onChange={(e) => patchTask(task.id, { due: e.target.value || null })}
            className="min-h-11 rounded-md bg-surface-2 px-3 text-fg"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor="notes">Notes</FieldLabel>
        <textarea
          id="notes"
          value={task.notes}
          onChange={(e) => patchTask(task.id, { notes: e.target.value.slice(0, 800) })}
          rows={4}
          placeholder="Context that stays on this device"
          className="w-full resize-none rounded-md bg-surface-2 px-3 py-3 text-fg placeholder:text-muted"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-muted">
          Steps{task.steps.length > 0 ? ` · ${doneSteps}/${task.steps.length}` : ""}
        </p>
        {task.steps.length === 0 ? (
          <p className="text-base text-muted">No steps yet. Brief can break this task down.</p>
        ) : (
          <ul className="flex flex-col">
            {task.steps.map((step) => (
              <li
                key={step.id}
                data-ai-synthetic={step.mark ? "true" : undefined}
                data-ai-schema={step.mark?.schema}
                data-ai-model={step.mark?.model}
                data-ai-mark={step.mark ? markToken(step.mark) : undefined}
              >
                <button
                  type="button"
                  onClick={() => toggleStep(task.id, step.id)}
                  className="flex min-h-11 w-full items-center gap-3 text-left"
                >
                  <span
                    className={
                      step.done
                        ? "grid size-5 shrink-0 place-items-center rounded-full bg-copper text-ink"
                        : "size-5 shrink-0 rounded-full shadow-line"
                    }
                    aria-hidden
                  >
                    {step.done ? "✓" : ""}
                  </span>
                  <span className={step.done ? "text-muted line-through" : "text-fg"}>{step.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {task.status !== "doing" && task.status !== "done" ? (
          <Button variant="line" onClick={() => setStatus(task.id, "doing")}>
            Start
          </Button>
        ) : null}
        {task.status !== "done" ? (
          <Button onClick={() => setStatus(task.id, "done")}>Finish</Button>
        ) : (
          <Button variant="line" onClick={() => setStatus(task.id, "open")}>
            Reopen
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            setView("brief");
            onClose?.();
          }}
        >
          Ask Brief
        </Button>
      </div>

      {armDelete ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ink"
            onClick={() => {
              removeTask(task.id);
              onClose?.();
            }}
          >
            Delete this task
          </Button>
          <Button variant="ghost" onClick={() => setArmDelete(false)}>
            Keep it
          </Button>
        </div>
      ) : (
        <button type="button" onClick={() => setArmDelete(true)} className="self-start text-sm text-muted underline">
          Delete task
        </button>
      )}
    </article>
  );
}
