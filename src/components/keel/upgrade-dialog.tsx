import * as Dialog from "@radix-ui/react-dialog";
import { planLabel, useKeel } from "@/lib/keel/store";
import { FREE_AI_CAP, FREE_OPEN_CAP, PAID_AI_CAP } from "@/lib/keel/data";
import { Button } from "@/components/keel/ui";

const rows = [
  { name: "Open tasks", free: String(FREE_OPEN_CAP), paid: "No desk cap" },
  { name: "Assists / day", free: String(FREE_AI_CAP), paid: String(PAID_AI_CAP) },
  { name: "Break one task down", free: "Included", paid: "Included" },
  { name: "Rewrite the whole board", free: "Locked", paid: "Included" },
  { name: "Billing", free: "None", paid: "Not charged in this preview" },
];

export function UpgradeDialog() {
  const reason = useKeel((s) => s.upgradeReason);
  const closeUpgrade = useKeel((s) => s.closeUpgrade);
  const plan = useKeel((s) => s.plan);
  const trialEnds = useKeel((s) => s.trialEnds);
  const startTrial = useKeel((s) => s.startTrial);
  const setPlan = useKeel((s) => s.setPlan);

  return (
    <Dialog.Root open={reason !== null} onOpenChange={(open) => !open && closeUpgrade()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-bg/80" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-paper p-5 text-ink shadow-line">
          <Dialog.Title className="font-display text-3xl leading-tight">Start the trial. Volume unlocks today.</Dialog.Title>
          <Dialog.Description className="mt-2 text-base text-ink/80">{reason}</Dialog.Description>
          <p className="mt-3 text-base text-ink">
            Seven days of no desk cap, 12 assists a day, and board rewrites. Pro preview keeps that after the week. No card is charged in this build.
          </p>
          <p className="mt-3 text-sm font-semibold tracking-wide text-ink/60 uppercase">
            You are on {planLabel(plan, trialEnds)}
          </p>
          <table className="mt-4 w-full text-left text-base">
            <thead>
              <tr className="text-sm text-ink/60">
                <th className="py-2 font-semibold"> </th>
                <th className="py-2 font-semibold">Free</th>
                <th className="py-2 font-semibold">Trial / Pro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-t border-ink/10">
                  <th className="py-2 pr-3 font-semibold">{row.name}</th>
                  <td className="py-2 tabular-nums">{row.free}</td>
                  <td className="py-2 tabular-nums">{row.paid}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-ink/70">
            Stripe at 2.9% + $0.30 is the processor in the plan, not a checkout here. Partner bundles wait on calendar and Slack.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {plan !== "trial" ? (
              <Button variant="ink" onClick={() => startTrial()}>
                Start 7-day trial
              </Button>
            ) : null}
            {plan !== "pro" ? (
              <Button variant="line" className="bg-paper text-ink" onClick={() => setPlan("pro")}>
                Preview Pro
              </Button>
            ) : null}
            {plan !== "free" ? (
              <Button variant="ghost" className="text-ink hover:bg-ink/5" onClick={() => setPlan("free")}>
                Return to Free
              </Button>
            ) : null}
            <Button variant="ghost" className="text-ink hover:bg-ink/5" onClick={closeUpgrade}>
              Not now
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
