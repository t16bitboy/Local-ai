import { useState } from "react";
import { FOCUS_OPTIONS, type Focus } from "@/lib/keel/workspace";
import { useKeel } from "@/lib/keel/store";
import { Button } from "@/components/keel/ui";

export function Onboard() {
  const finishOnboarding = useKeel((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [focus, setFocus] = useState<Focus>("ship");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [remindersOn, setRemindersOn] = useState(true);

  async function openDesk() {
    if (remindersOn && typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // The in-app bell still works if the browser refuses.
      }
    }
    finishOnboarding({
      name: name.trim().slice(0, 40),
      focus,
      reminderTime,
      remindersOn,
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-8 px-5 py-10">
      <header>
        <p className="font-display text-4xl leading-none">Keel</p>
        <p className="mt-2 text-lg text-muted">Keep one piece of work on the hook.</p>
      </header>
      <section className="rounded-lg bg-paper p-5 text-ink">
        <p className="text-sm font-semibold tracking-wide text-ink/60 uppercase">Step {step + 1} of 3</p>
        {step === 0 ? (
          <div className="mt-3 flex flex-col gap-4">
            <h1 className="text-3xl">Who is this desk for?</h1>
            <p className="text-ink/75">A name keeps the reminder human. It stays in this browser. There is no account.</p>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink/70">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                maxLength={40}
                className="min-h-12 rounded-md bg-bg px-3 text-base font-normal text-fg"
                autoComplete="name"
              />
            </label>
            <Button variant="ink" onClick={() => setStep(1)}>
              Continue
            </Button>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="mt-3 flex flex-col gap-3">
            <h1 className="text-3xl">What should the desk protect?</h1>
            <div className="flex flex-col gap-2">
              {FOCUS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFocus(option.id)}
                  aria-pressed={focus === option.id}
                  className={
                    focus === option.id
                      ? "min-h-16 rounded-md bg-ink px-4 py-3 text-left text-paper"
                      : "min-h-16 rounded-md bg-bg px-4 py-3 text-left text-fg"
                  }
                >
                  <span className="block font-semibold">{option.title}</span>
                  <span className={focus === option.id ? "text-paper/75" : "text-muted"}>{option.detail}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="text-ink hover:bg-ink/5" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button variant="ink" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="mt-3 flex flex-col gap-4">
            <h1 className="text-3xl">When should Keel tap you?</h1>
            <p className="text-ink/75">
              A reminder fires while this tab is open, after the time you pick. Nothing is emailed. Closing the tab ends the nudge.
            </p>
            <label className="flex flex-col gap-1 text-sm font-semibold text-ink/70">
              Time
              <input
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value || "09:00")}
                className="min-h-12 rounded-md bg-bg px-3 text-base font-normal text-fg"
              />
            </label>
            <label className="flex min-h-11 items-center gap-3 text-base">
              <input
                type="checkbox"
                checked={remindersOn}
                onChange={(event) => setRemindersOn(event.target.checked)}
                className="size-5 accent-copper"
              />
              Remind me in this browser
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" className="text-ink hover:bg-ink/5" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="ink" onClick={() => void openDesk()}>
                Open the desk
              </Button>
            </div>
          </div>
        ) : null}
      </section>
      <p className="text-sm text-muted">
        Brief is an AI system, Grok. It speaks only when you send, replies are marked, and you can turn it off. Free includes the desk and three assists a day. Paid is volume, and it is not charged in this preview.
      </p>
    </main>
  );
}
