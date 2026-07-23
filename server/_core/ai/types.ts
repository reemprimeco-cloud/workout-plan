/**
 * Vendor-neutral AI types and the AiProvider interface.
 *
 * These types are the stable contract the application depends on. No router or
 * business-logic file references a specific vendor — they call `invokeLLM`
 * (server/_core/llm.ts) or the provider methods here, and the concrete
 * implementation (OpenAI today, others later) is selected from env in
 * server/_core/ai/index.ts. The chat shapes intentionally mirror the widely
 * adopted OpenAI chat-completions schema so any OpenAI-compatible endpoint
 * works without app changes.
 */

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = { type: "text"; text: string };

export type ImageContent = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = { type: "function"; function: { name: string } };
export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// ── Audio transcription ───────────────────────────────────────────────────────
export type TranscribeParams = {
  audio: ArrayBuffer | Uint8Array;
  filename: string;
  contentType: string;
  language?: string;
};

export type TranscribeSegment = {
  id?: number;
  start?: number;
  end?: number;
  text: string;
};

export type TranscribeResult = {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscribeSegment[];
};

// ── Image generation ──────────────────────────────────────────────────────────
export type GenerateImageParams = {
  prompt: string;
  size?: string;
};

export type GenerateImageResult = {
  b64Json: string;
  mimeType: string;
};

/**
 * A pluggable AI backend. Add a new vendor by implementing this interface and
 * registering it in server/_core/ai/index.ts — no application code changes.
 */
export interface AiProvider {
  readonly name: string;
  chat(params: InvokeParams): Promise<InvokeResult>;
  transcribe(params: TranscribeParams): Promise<TranscribeResult>;
  generateImage(params: GenerateImageParams): Promise<GenerateImageResult>;
}
