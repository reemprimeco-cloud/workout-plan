import { getAiProvider } from "./ai";
import type { InvokeParams, InvokeResult } from "./ai/types";

// Public LLM entry point. The concrete vendor lives behind the AiProvider
// abstraction (server/_core/ai) and is selected from env, so callers here and
// in the routers are vendor-agnostic. The chat request/response types are
// re-exported so existing imports (`import { invokeLLM, type Message }`) keep
// working unchanged.
export type {
  Role,
  TextContent,
  ImageContent,
  FileContent,
  MessageContent,
  Message,
  Tool,
  ToolChoice,
  ToolChoicePrimitive,
  ToolChoiceByName,
  ToolChoiceExplicit,
  InvokeParams,
  ToolCall,
  InvokeResult,
  JsonSchema,
  OutputSchema,
  ResponseFormat,
} from "./ai/types";

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  return getAiProvider().chat(params);
}
