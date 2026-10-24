import https from "node:https";
import { allowsUnmeteredAssistant } from "@/lib/keel/assistant-policy";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const packed = z.object({
  id: z.string().min(1).max(40),
  title: z.string().min(1).max(180),
  priority: z.enum(["now", "next", "later"]),
  status: z.enum(["open", "doing", "done"]),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

const inputSchema = z.object({
  prompt: z.string().trim().min(1).max(1200),
  focusId: z.string().max(40).nullable(),
  tasks: z.array(packed).max(16),
});

const outputSchema = z.object({
  reply: z.string().min(1).max(2000),
  steps: z.array(z.string().min(1).max(160)).max(6).nullable().optional(),
  focusId: z.string().max(40).nullable().optional(),
  rewrites: z
    .array(z.object({ id: z.string().max(40), title: z.string().min(1).max(140) }))
    .max(12)
    .nullable()
    .optional(),
});

export type AssistOk = {
  ok: true;
  reply: string;
  steps: string[] | null;
  focusId: string | null;
  rewrites: { id: string; title: string }[] | null;
  model: string;
};

export type AssistResult = AssistOk | { ok: false; error: string };

const MODEL = "grok-4.5";

export const assistantStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: Boolean(process.env.XAI_API_KEY) && allowsUnmeteredAssistant(process.env) };
});

export const assistTask = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) throw new Error("That request didn’t look right.");
    return parsed.data;
  })
  .handler(async ({ data }): Promise<AssistResult> => {
    if (!allowsUnmeteredAssistant(process.env)) {
      return { ok: false, error: "Live AI is disabled until server spending controls are available. Use an offline draft." };
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "The assistant isn’t configured in this environment." };

    const lines = data.tasks
      .map((t) => `- ${t.id} | ${t.status} | ${t.priority} | due ${t.due ?? "none"} | ${t.title}`)
      .join("\n");

    const system = [
      "You are Keel, a task assistant. Be concrete and short. Use only the tasks listed.",
      "Return JSON only, no markdown fence:",
      '{"reply":"","steps":null,"focusId":null,"rewrites":null}',
      "steps: 2 to 5 short imperative strings if the user asked to break a task down, else null.",
      "focusId: one listed task id if you recommend what to do next, else null.",
      "rewrites: [{id,title}] only if the user asked to rewrite titles, using only listed ids, else null.",
      "reply: plain sentences, no markdown, under 90 words. Do not invent tasks.",
    ].join(" ");

    const user = [
      data.focusId ? `They are looking at task ${data.focusId}.` : "They are not focused on one task.",
      "Tasks:",
      lines || "(none)",
      "Request:",
      data.prompt,
    ].join("\n");

    let res: { status: number; text: string };
    try {
      res = await postJson(
        "https://api.x.ai/v1/chat/completions",
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        JSON.stringify({
          model: MODEL,
          temperature: 0.3,
          max_tokens: 450,
          reasoning_effort: "low",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        25_000,
      );
    } catch {
      return { ok: false, error: "The assistant didn’t respond. Try again, or use an offline draft." };
    }

    if (res.status < 200 || res.status >= 300) {
      return { ok: false, error: `The assistant didn’t answer (${res.status}).` };
    }

    let body: { choices?: { message?: { content?: unknown } }[] };
    try {
      body = JSON.parse(res.text) as { choices?: { message?: { content?: unknown } }[] };
    } catch {
      return { ok: false, error: "The assistant returned something unreadable." };
    }
    const raw = messageText(body.choices?.[0]?.message?.content).trim();
    if (!raw) return { ok: false, error: "The assistant returned an empty reply." };

    const known = new Set(data.tasks.map((t) => t.id));
    const structured = parseOutput(raw, known);
    if (!structured) {
      return {
        ok: true,
        reply: raw.slice(0, 1200),
        steps: null,
        focusId: null,
        rewrites: null,
        model: MODEL,
      };
    }
    return { ok: true, model: MODEL, ...structured };
  });

function postJson(
  url: string,
  headers: Record<string, string>,
  body: string,
  timeoutMs: number,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const req = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        method: "POST",
        headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            text: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) return String((part as { text: unknown }).text);
      return "";
    })
    .join("");
}

function parseOutput(
  raw: string,
  known: Set<string>,
): Omit<AssistOk, "ok" | "model"> | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let value: unknown;
  try {
    value = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  const parsed = outputSchema.safeParse(value);
  if (!parsed.success) return null;
  const steps = parsed.data.steps?.map((s) => s.trim()).filter(Boolean) ?? null;
  const focusId = parsed.data.focusId && known.has(parsed.data.focusId) ? parsed.data.focusId : null;
  const rewrites =
    parsed.data.rewrites
      ?.filter((row) => known.has(row.id))
      .map((row) => ({ id: row.id, title: row.title.trim() }))
      .filter((row) => row.title.length > 0) ?? null;
  return {
    reply: parsed.data.reply.trim(),
    steps: steps && steps.length > 0 ? steps.slice(0, 6) : null,
    focusId,
    rewrites: rewrites && rewrites.length > 0 ? rewrites : null,
  };
}
