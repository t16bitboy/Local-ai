import { useEffect, useState } from "react";
import { assistTask, assistantStatus } from "@/lib/keel/assist";
import {
  aiCap,
  aiMark,
  hookTask,
  markToken,
  offlineDraft,
  packTasks,
  ROUTES,
  uid,
  type AssistPayload,
  type Mark,
} from "@/lib/keel/data";
import { useKeel } from "@/lib/keel/store";
import { Button } from "@/components/keel/ui";

export function Brief() {
  const tasks = useKeel((s) => s.tasks);
  const plan = useKeel((s) => s.plan);
  const aiEnabled = useKeel((s) => s.aiEnabled);
  const setAiEnabled = useKeel((s) => s.setAiEnabled);
  const turns = useKeel((s) => s.turns);
  const pushTurn = useKeel((s) => s.pushTurn);
  const selectedId = useKeel((s) => s.selectedId);
  const usesToday = useKeel((s) => s.usesToday);
  const recordAssist = useKeel((s) => s.recordAssist);
  const attachSteps = useKeel((s) => s.attachSteps);
  const applyRewrites = useKeel((s) => s.applyRewrites);
  const openUpgrade = useKeel((s) => s.openUpgrade);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const hook = hookTask(tasks);
  const focusId = tasks.some((t) => t.id === selectedId) ? selectedId : (hook?.id ?? null);
  const focus = tasks.find((t) => t.id === focusId) ?? null;
  const used = usesToday();
  const cap = aiCap(plan);

  useEffect(() => {
    let live = true;
    assistantStatus()
      .then((res) => {
        if (live) setConfigured(res.configured);
      })
      .catch(() => {
        if (live) setConfigured(false);
      });
    return () => {
      live = false;
    };
  }, []);

  async function send(text: string, opts?: { rewrite?: boolean }) {
    const clean = text.trim();
    if (!clean || busy) return;
    if (opts?.rewrite && plan === "free") {
      openUpgrade("Rewriting the whole board is a Pro action. Breaking down one task stays free.", true);
      return;
    }
    if (aiEnabled && usesToday() >= cap) {
      openUpgrade(
        plan === "free"
          ? "Three assists are included today. The trial lifts the cap to 12."
          : "Today’s assist cap is spent. It resets tomorrow.",
        true,
      );
      return;
    }
    pushTurn({ id: uid(), kind: "you", text: clean, at: Date.now() });
    setPrompt("");
    if (!aiEnabled) {
      const draft = offlineDraft(clean, packTasks(tasks, focusId), focusId);
      pushTurn({ id: uid(), kind: "offline", text: draft.text, at: Date.now(), payload: draft.payload });
      return;
    }
    setBusy(true);
    try {
      const result = await assistTask({
        data: { prompt: clean, focusId, tasks: packTasks(tasks, focusId) },
      });
      if (!result.ok) {
        pushTurn({ id: uid(), kind: "error", text: result.error, at: Date.now() });
        return;
      }
      recordAssist();
      const mark = aiMark(result.model);
      pushTurn({
        id: uid(),
        kind: "model",
        text: result.reply,
        at: Date.now(),
        model: result.model,
        mark,
        payload: {
          steps: result.steps,
          focusId: result.focusId,
          rewrites: result.rewrites,
        },
      });
    } catch {
      pushTurn({
        id: uid(),
        kind: "error",
        text: "The assistant didn’t respond. You can still draft without a model.",
        at: Date.now(),
      });
    } finally {
      setBusy(false);
    }
  }

  function draftOffline() {
    const clean = prompt.trim() || (focus ? `Break down ${focus.title}` : "Order my open tasks");
    pushTurn({ id: uid(), kind: "you", text: clean, at: Date.now() });
    const draft = offlineDraft(clean, packTasks(tasks, focusId), focusId);
    pushTurn({ id: uid(), kind: "offline", text: draft.text, at: Date.now(), payload: draft.payload });
    setPrompt("");
  }

  return (
    <div className="flex min-h-[70dvh] flex-col gap-4">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl">Brief</h2>
            <p className="mt-1 max-w-xl text-base text-muted">
              {focus ? `Looking at “${focus.title}”.` : "No open task to focus."} Nothing is sent until you press a button.
            </p>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-base">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              className="size-5 accent-copper"
            />
            Assistant on
          </label>
        </div>
        <aside className="rounded-md bg-paper px-4 py-3 text-ink" role="note" aria-label="AI disclosure">
          <p className="text-sm font-semibold tracking-wide text-ink/60 uppercase">You are using an AI system</p>
          <p className="mt-1 text-base">
            Grok writes the replies when the assistant is on. Each one is labeled and carries a machine-readable mark. Turn the assistant off and this desk still works.
          </p>
        </aside>
        <p className="text-sm text-muted tabular-nums">
          {configured === null
            ? "Checking whether Grok is connected."
            : configured
              ? "Grok 4.5 is the live route."
              : "Grok isn’t configured here. Offline drafts still work."}{" "}
          {aiEnabled ? `${used} of ${cap} assists used today.` : "Assists are paused."}
        </p>
        <ul className="flex flex-wrap gap-2">
          {ROUTES.map((route) => (
            <li
              key={route.id}
              className={
                route.state === "live"
                  ? "rounded-md bg-copper px-3 py-1 text-sm font-semibold text-ink"
                  : "rounded-md bg-surface px-3 py-1 text-sm text-muted shadow-line"
              }
            >
              {route.name}
              {route.state === "standby" ? " · standby" : " · live"}
            </li>
          ))}
        </ul>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        {turns.length === 0 ? (
          <p className="rounded-md bg-surface px-4 py-4 text-base text-muted shadow-line">
            Ask for an order of work, or a breakdown of the task on the hook. Nothing is sent until you press a button.
          </p>
        ) : (
          turns.map((turn) => <Bubble key={turn.id} turn={turn} tasks={tasks} />)
        )}
      </div>

      <div className="sticky bottom-20 z-10 flex flex-col gap-3 bg-bg pt-2 md:bottom-0">
        <div className="flex flex-wrap gap-2">
          <Button variant="line" disabled={busy} onClick={() => void send("Order my open tasks. Name the one to do next and why.")}>
            Order the board
          </Button>
          <Button
            variant="line"
            disabled={busy || !focus}
            onClick={() => focus && void send(`Break “${focus.title}” into concrete steps.`)}
          >
            Break this down
          </Button>
          <Button variant="line" disabled={busy} onClick={() => void send("Rewrite every open task title so it starts with a verb.", { rewrite: true })}>
            Rewrite titles
          </Button>
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void send(prompt);
          }}
        >
          <label className="sr-only" htmlFor="brief-prompt">
            Message
          </label>
          <input
            id="brief-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={1200}
            placeholder={aiEnabled ? "Ask about the work in front of you" : "Assistant is off — this will draft offline"}
            className="min-h-12 w-full flex-1 rounded-md bg-surface px-4 text-fg shadow-line placeholder:text-muted"
          />
          <Button type="submit" disabled={busy || !prompt.trim()}>
            {busy ? "Drafting…" : aiEnabled ? "Send" : "Draft offline"}
          </Button>
          {aiEnabled ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={draftOffline}>
              Without a model
            </Button>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function markAttrs(mark: Mark) {
  return {
    "data-ai-synthetic": "true",
    "data-ai-schema": mark.schema,
    "data-ai-model": mark.model,
    "data-ai-mark": markToken(mark),
  };
}

function MarkLine({ mark }: { mark: Mark }) {
  return (
    <p className="mt-1 text-sm break-all text-muted" {...markAttrs(mark)}>
      {markToken(mark)}
    </p>
  );
}

function Bubble({
  turn,
  tasks,
}: {
  turn: ReturnType<typeof useKeel.getState>["turns"][number];
  tasks: ReturnType<typeof useKeel.getState>["tasks"];
}) {
  const attachSteps = useKeel((s) => s.attachSteps);
  const applyRewrites = useKeel((s) => s.applyRewrites);
  if (turn.kind === "you") {
    return (
      <div className="ml-auto max-w-[40rem] rounded-md bg-surface-2 px-4 py-3 text-fg">
        <p>{turn.text}</p>
      </div>
    );
  }
  if (turn.kind === "error") {
    return (
      <p className="max-w-[40rem] rounded-md bg-surface px-4 py-3 text-copper shadow-line">{turn.text}</p>
    );
  }
  const payload: AssistPayload = turn.payload;
  const via = turn.kind === "model" ? "model" : "offline";
  const targetId = payload.focusId && tasks.some((t) => t.id === payload.focusId) ? payload.focusId : null;
  const target = tasks.find((t) => t.id === targetId);
  return (
    <article
      className="max-w-[40rem] rounded-md bg-surface px-4 py-3 shadow-line"
      {...(turn.kind === "model" && turn.mark ? markAttrs(turn.mark) : {})}
    >
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">
        {turn.kind === "model" ? `Generated by ${turn.model}` : "Offline draft · not a model"}
      </p>
      {turn.kind === "model" && turn.mark ? <MarkLine mark={turn.mark} /> : null}
      <p className="mt-2 text-fg">{turn.text}</p>
      {payload.steps && target ? (
        <div className="mt-3 flex flex-col gap-2">
          <ol className="list-decimal pl-5 text-fg">
            {payload.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Button variant="line" className="self-start" onClick={() => attachSteps(target.id, payload.steps ?? [], via, turn.kind === "model" ? turn.model : null)}>
            Add steps to {target.title}
          </Button>
        </div>
      ) : null}
      {payload.rewrites && payload.rewrites.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          <ul className="flex flex-col gap-1 text-sm">
            {payload.rewrites.map((row) => {
              const current = tasks.find((t) => t.id === row.id);
              if (!current || current.title === row.title) return null;
              return (
                <li key={row.id}>
                  <span className="text-muted">{current.title}</span>
                  <span className="text-muted"> → </span>
                  <span>{row.title}</span>
                </li>
              );
            })}
          </ul>
          <Button variant="line" className="self-start" onClick={() => applyRewrites(payload.rewrites ?? [], via, turn.kind === "model" ? turn.model : null)}>
            Apply these titles
          </Button>
        </div>
      ) : null}
    </article>
  );
}
