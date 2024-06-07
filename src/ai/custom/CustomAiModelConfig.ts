import {AiModelConfig} from "../core/AiModelConfig.ts";
import {AiMessage} from "../core/AiMessage.ts";

export interface CustomAiModelConfig extends AiModelConfig {
    url: (() => string) | string,
    headers?: () => Record<string, any> | undefined,
    wrapPayload: (prompt: string) => string,
    parseMessage: (bodyString: string) => AiMessage | undefined,
    protocol: "sse" | "websocket"
}
