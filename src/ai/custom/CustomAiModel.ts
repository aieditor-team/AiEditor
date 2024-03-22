import {AiClient} from "../core/AiClient.ts";
import {AiMessageListener} from "../core/AiMessageListener.ts";
import {AiModel} from "../core/AiModel.ts";
import {AiGlobalConfig} from "../AiGlobalConfig.ts";
import {Editor} from "@tiptap/core";

import {CustomAiModelConfig} from "./CustomAiModelConfig.ts";
import {SseClient} from "../core/client/sse/SseClient.ts";
import {AiClientListener} from "../core/AiClientListener.ts";
import {WebSocketClient} from "../core/client/ws/WebSocketClient.ts";

export class CustomAiModel extends AiModel {

    constructor(editor: Editor, globalConfig: AiGlobalConfig) {
        super(editor, globalConfig, "custom");
        this.aiModelConfig = {
            protocol: "sse",
            ...globalConfig.models["custom"]
        } as CustomAiModelConfig;
    }

    createAiClient(url: string, listener: AiMessageListener): AiClient {
        const config = this.aiModelConfig as CustomAiModelConfig;
        const aiClientListener: AiClientListener = {
            onStart: listener.onStart,
            onStop: listener.onStop,
            onMessage: (messageResp) => {
                const config = this.aiModelConfig as CustomAiModelConfig;
                const aiMessage = config.messageParser?.(messageResp);
                if (aiMessage) listener.onMessage(aiMessage);
            }
        };
        return config.protocol === "sse" ? new SseClient({
                url,
                method: "post",
                headers: config.headers?.()
            }, aiClientListener)
            : new WebSocketClient(url, aiClientListener)
    }

    wrapMessage(promptMessage: string) {
        const config = this.aiModelConfig as CustomAiModelConfig;
        return config.messageWrapper?.(promptMessage);
    }


    createAiClientUrl(): string {
        const config = this.aiModelConfig as CustomAiModelConfig;
        if (typeof config.url === "string") {
            return config.url as string;
        }
        return config.url?.();
    }


}