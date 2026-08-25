import { cookies } from "next/headers";
import { z } from "zod";

const settingsSchema = z.object({
  model: z.string().trim().min(1).max(200),
  baseUrl: z.string().url().max(1000),
  apiKey: z.string().max(1000).optional(),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 180,
};

export async function GET() {
  const store = await cookies();
  return Response.json({
    model: store.get("ff-model")?.value ?? "gpt-4.1-mini",
    baseUrl: store.get("ff-base-url")?.value ?? "https://api.openai.com/v1",
    hasApiKey: Boolean(store.get("ff-api-key")?.value),
  });
}

export async function POST(request: Request) {
  try {
    const settings = settingsSchema.parse(await request.json());
    const store = await cookies();
    store.set("ff-model", settings.model, cookieOptions);
    store.set("ff-base-url", settings.baseUrl, cookieOptions);
    if (settings.apiKey) store.set("ff-api-key", settings.apiKey, cookieOptions);
    return Response.json({ saved: true, hasApiKey: Boolean(settings.apiKey || store.get("ff-api-key")?.value) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid model settings.";
    return Response.json({ error: message }, { status: 400 });
  }
}
