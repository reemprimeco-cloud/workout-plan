import { ENV } from "../env";
import type {
  AiProvider,
  InvokeParams,
  InvokeResult,
  JsonSchema,
  Message,
  MessageContent,
  ResponseFormat,
  OutputSchema,
  Tool,
  ToolChoice,
  ToolChoiceExplicit,
  TextContent,
  ImageContent,
  FileContent,
  TranscribeParams,
  TranscribeResult,
  GenerateImageParams,
  GenerateImageResult,
} from "./types";

// OpenAI (and any OpenAI-compatible endpoint) implementation of AiProvider.
// Base URL, key, and model names all come from env — nothing vendor-specific
// is hard-coded, so pointing at Azure OpenAI, a local gateway, or another
// OpenAI-compatible service is purely configuration.

const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

const normalizeContentPart = (part: MessageContent): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") return { type: "text", text: part };
  if (part.type === "text" || part.type === "image_url" || part.type === "file_url") return part;
  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");
    return { role, name, tool_call_id, content };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return { role, name, content: contentParts[0].text };
  }
  return { role, name, content: contentParts };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined,
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;
  if (toolChoice === "none" || toolChoice === "auto") return toolChoice;
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error("tool_choice 'required' was provided but no tools were configured");
    }
    if (tools.length > 1) {
      throw new Error("tool_choice 'required' needs a single tool or specify the tool name explicitly");
    }
    return { type: "function", function: { name: tools[0].function.name } };
  }
  if ("name" in toolChoice) {
    return { type: "function", function: { name: toolChoice.name } };
  }
  return toolChoice;
};

const normalizeResponseFormat = (params: InvokeParams):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat: ResponseFormat | undefined = params.responseFormat || params.response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }
  const schema: OutputSchema | undefined = params.outputSchema || params.output_schema;
  if (!schema) return undefined;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

function baseUrl(): string {
  return ENV.openaiBaseUrl.replace(/\/+$/, "");
}

function assertKey(): void {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
}

export const openAiProvider: AiProvider = {
  name: "openai",

  async chat(params: InvokeParams): Promise<InvokeResult> {
    assertKey();

    const payload: Record<string, unknown> = {
      model: ENV.aiModel,
      messages: params.messages.map(normalizeMessage),
    };

    if (params.tools && params.tools.length > 0) payload.tools = params.tools;

    const toolChoice = normalizeToolChoice(params.toolChoice || params.tool_choice, params.tools);
    if (toolChoice) payload.tool_choice = toolChoice;

    const maxTokens = params.maxTokens ?? params.max_tokens;
    if (typeof maxTokens === "number") payload.max_tokens = maxTokens;

    const responseFormat = normalizeResponseFormat(params);
    if (responseFormat) payload.response_format = responseFormat;

    const response = await fetch(`${baseUrl()}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.openaiApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
    }

    return (await response.json()) as InvokeResult;
  },

  async transcribe(params: TranscribeParams): Promise<TranscribeResult> {
    assertKey();

    const form = new FormData();
    const bytes = params.audio instanceof Uint8Array ? params.audio : new Uint8Array(params.audio);
    form.append("file", new Blob([bytes as BlobPart], { type: params.contentType }), params.filename);
    form.append("model", ENV.aiTranscribeModel);
    form.append("response_format", "verbose_json");
    if (params.language) form.append("language", params.language);

    const response = await fetch(`${baseUrl()}/v1/audio/transcriptions`, {
      method: "POST",
      headers: { authorization: `Bearer ${ENV.openaiApiKey}` },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription failed: ${response.status} ${response.statusText} – ${errorText}`);
    }

    const data = (await response.json()) as {
      text: string;
      language?: string;
      duration?: number;
      segments?: Array<{ id?: number; start?: number; end?: number; text: string }>;
    };
    return {
      text: data.text,
      language: data.language,
      duration: data.duration,
      segments: data.segments,
    };
  },

  async generateImage(params: GenerateImageParams): Promise<GenerateImageResult> {
    assertKey();

    const response = await fetch(`${baseUrl()}/v1/images/generations`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: ENV.aiImageModel,
        prompt: params.prompt,
        size: params.size ?? "1024x1024",
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Image generation failed: ${response.status} ${response.statusText} – ${errorText}`);
    }

    const data = (await response.json()) as { data: Array<{ b64_json?: string }> };
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image generation returned no image data");
    return { b64Json: b64, mimeType: "image/png" };
  },
};
