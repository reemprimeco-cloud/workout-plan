import { ENV } from "../env";
import type { AiProvider } from "./types";
import { openAiProvider } from "./openai";

export * from "./types";

// Provider registry. To add Anthropic / Gemini / any OpenAI-compatible backend,
// implement AiProvider (see openai.ts) and register it here keyed by AI_PROVIDER.
const providers: Record<string, AiProvider> = {
  openai: openAiProvider,
};

let cached: AiProvider | null = null;

/** Returns the AI provider selected by the AI_PROVIDER env var (default openai). */
export function getAiProvider(): AiProvider {
  if (cached) return cached;
  const key = (ENV.aiProvider || "openai").toLowerCase();
  const provider = providers[key];
  if (!provider) {
    throw new Error(
      `Unknown AI_PROVIDER "${ENV.aiProvider}". Available: ${Object.keys(providers).join(", ")}`,
    );
  }
  cached = provider;
  return provider;
}
