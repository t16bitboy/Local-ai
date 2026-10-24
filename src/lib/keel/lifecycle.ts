import { useKeel } from "@/lib/keel/store";

// Timers are best effort in suspended tabs. Focus/visibility catch up on return.
export function startKeelClock() {
  const refresh = () => {
    const state = useKeel.getState();
    if (state.plan === "trial" && state.trialEnds !== null && state.trialEnds <= Date.now()) {
      useKeel.setState({ plan: "free", trialEnds: null });
    }
    useKeel.getState().noteVisit();
  };
  refresh();
  const timer = setInterval(refresh, 30_000);
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  return () => {
    clearInterval(timer);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}
