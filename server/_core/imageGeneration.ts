/**
 * Image generation helper.
 *
 * Generates an image via the vendor-agnostic AI provider (server/_core/ai) and
 * stores it through the storage abstraction. No dependency on any AI vendor.
 *
 * Example:
 *   const { url } = await generateImage({ prompt: "A serene mountain landscape" });
 */
import { storagePut } from "../storage";
import { getAiProvider } from "./ai";

export type GenerateImageOptions = {
  prompt: string;
  size?: string;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions,
): Promise<GenerateImageResponse> {
  const image = await getAiProvider().generateImage({
    prompt: options.prompt,
    size: options.size,
  });

  const buffer = Buffer.from(image.b64Json, "base64");
  const { url } = await storagePut(
    `ai-assets/${Date.now()}.png`,
    buffer,
    image.mimeType,
  );
  return { url };
}
