import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { cookies } from "next/headers";

export const maxDuration = 20;

export async function POST() {
  try {
    const store = await cookies();
    const model = store.get("ff-model")?.value;
    const baseUrl = store.get("ff-base-url")?.value;
    const apiKey = store.get("ff-api-key")?.value;
    if (!model || !baseUrl || !apiKey) {
      return Response.json({ ready: false, error: "Add an API key for AI edits." }, { status: 400 });
    }

    const provider = createOpenAICompatible({
      name: "figure-factory-preflight",
      baseURL: baseUrl.replace(/\/$/, ""),
      apiKey,
    });
    await generateText({
      model: provider.chatModel(model),
      system: "Reply with exactly OK.",
      prompt: "Connection check",
      maxOutputTokens: 2,
    });
    return Response.json({ ready: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Model connection failed.";
    return Response.json({ ready: false, error: message }, { status: 400 });
  }
}
