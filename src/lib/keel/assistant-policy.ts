// The prototype has no trusted identity, quotas or shared spending ledger.
// Keep production closed even when an API key is accidentally provisioned.
export function allowsUnmeteredAssistant(env: Record<string, string | undefined>): boolean {
  return env.NODE_ENV === "development" && env.KEEL_ALLOW_UNMETERED_AI === "true";
}
