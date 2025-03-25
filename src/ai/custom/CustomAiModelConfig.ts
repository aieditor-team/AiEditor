import {AiModelConfig} from "../core/AiModelConfig.ts";
import {AiMessage} from "../core/AiMessage.ts";

export interface CustomAiModelConfig extends AiModelConfig {
    url: string | (() => string),
    protocol?: "sse" | "websocket" | "http"
    method?: string;
    headers?:  Record<string, any> | (() => Record<string, any>),
    wrapPayload: (prompt: string) => string,
    parseMessage: (bodyString: string) => AiMessage | undefined,
}
