// Standalone review deliberately has no server endpoint or live model access.
export const assistantStatus = async () => ({ configured: false });
export const assistTask = async () => ({ ok: false as const, error: "This review uses offline drafts." });
