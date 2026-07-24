/**
 * Voice transcription helper.
 *
 * Downloads an audio file from a URL and transcribes it via the vendor-agnostic
 * AI provider (server/_core/ai) — no direct dependency on any AI vendor. The
 * public `transcribeAudio(options)` shape is preserved.
 */
import { getAiProvider } from "./ai";

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type TranscribeSegment = {
  id?: number;
  start?: number;
  end?: number;
  text: string;
};

export type TranscriptionResponse = {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscribeSegment[];
};

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "UPLOAD_FAILED" | "SERVICE_ERROR";
  details?: string;
};

const MAX_AUDIO_MB = 16;

export async function transcribeAudio(
  options: TranscribeOptions,
): Promise<TranscriptionResponse | TranscriptionError> {
  try {
    // Download the audio.
    let audioBuffer: Buffer;
    let mimeType: string;
    try {
      const response = await fetch(options.audioUrl);
      if (!response.ok) {
        return { error: "Failed to download audio file", code: "INVALID_FORMAT", details: `HTTP ${response.status}: ${response.statusText}` };
      }
      audioBuffer = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get("content-type") || "audio/mpeg";
      const sizeMB = audioBuffer.length / (1024 * 1024);
      if (sizeMB > MAX_AUDIO_MB) {
        return { error: "Audio file exceeds maximum size limit", code: "FILE_TOO_LARGE", details: `File size is ${sizeMB.toFixed(2)}MB, maximum allowed is ${MAX_AUDIO_MB}MB` };
      }
    } catch (error) {
      return { error: "Failed to fetch audio file", code: "SERVICE_ERROR", details: error instanceof Error ? error.message : "Unknown error" };
    }

    const result = await getAiProvider().transcribe({
      audio: new Uint8Array(audioBuffer),
      filename: `audio.${getFileExtension(mimeType)}`,
      contentType: mimeType,
      language: options.language,
    });

    if (!result.text || typeof result.text !== "string") {
      return { error: "Invalid transcription response", code: "SERVICE_ERROR", details: "The AI provider returned an invalid response format" };
    }
    return result;
  } catch (error) {
    return { error: "Voice transcription failed", code: "SERVICE_ERROR", details: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
  };
  return mimeToExt[mimeType] || "audio";
}
