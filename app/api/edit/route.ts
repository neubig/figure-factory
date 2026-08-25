import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, stepCountIs, tool } from "ai";
import { cookies } from "next/headers";
import { z } from "zod";
import { replaceInSvg, validateSvg } from "@/lib/svg-tools";

export const maxDuration = 60;

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  svg: z.string().min(1).max(500_000),
});

const SYSTEM_PROMPT = `You are the art director inside Figure Factory, an SVG editing application.
Edit the supplied SVG to satisfy the user's request. You have coding-agent-style file tools:
- replace_svg: make small, exact replacements. Prefer this for focused edits. The search text must occur exactly once.
- write_svg: replace the full document. Use only for broad redesigns or when targeted replacement is impractical.

Keep the output as one valid, self-contained SVG. Preserve the viewBox unless the user asks otherwise. Prefer SVG-native shapes and text. Do not use scripts, event handlers, foreignObject, external images, or JavaScript URLs. Make a tool call to perform the edit; do not merely explain it.`;

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.parse(await request.json());
    let workingSvg = validateSvg(parsed.svg);
    const store = await cookies();
    const model = store.get("ff-model")?.value;
    const baseUrl = store.get("ff-base-url")?.value;
    const apiKey = store.get("ff-api-key")?.value;
    if (!model || !baseUrl || !apiKey) {
      throw new Error("Save your model, base URL, and API key before editing.");
    }

    const provider = createOpenAICompatible({
      name: "figure-factory-provider",
      baseURL: baseUrl.replace(/\/$/, ""),
      apiKey,
    });

    const result = await generateText({
      model: provider.chatModel(model),
      system: SYSTEM_PROMPT,
      prompt: `Current SVG:\n\n${workingSvg}\n\nRequested edit:\n${parsed.prompt}`,
      stopWhen: stepCountIs(8),
      tools: {
        replace_svg: tool({
          description: "Replace one unique, exact span of SVG source with new SVG source.",
          inputSchema: z.object({
            search: z.string().describe("Exact existing SVG source, including enough context to be unique."),
            replace: z.string().describe("Replacement SVG source."),
          }),
          execute: async (operation) => {
            workingSvg = validateSvg(replaceInSvg(workingSvg, operation));
            return { success: true, svgLength: workingSvg.length };
          },
        }),
        write_svg: tool({
          description: "Replace the complete SVG document for a broad redesign.",
          inputSchema: z.object({ svg: z.string().describe("A complete, self-contained SVG document.") }),
          execute: async ({ svg }) => {
            workingSvg = validateSvg(svg);
            return { success: true, svgLength: workingSvg.length };
          },
        }),
      },
    });

    if (result.steps.every((step) => step.toolCalls.length === 0)) {
      throw new Error("The model did not make an SVG edit. Try a more specific instruction.");
    }

    return Response.json({ svg: workingSvg, summary: result.text || "Canvas updated" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to edit the SVG.";
    return Response.json({ error: message }, { status: 400 });
  }
}
