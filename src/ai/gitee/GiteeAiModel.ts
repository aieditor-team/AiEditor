import {AiClient} from "../core/AiClient.ts";
import {AiMessageListener} from "../core/AiMessageListener.ts";
import {AiModel} from "../core/AiModel.ts";
import {AiGlobalConfig} from "../AiGlobalConfig.ts";
import {SseClient} from "../core/client/sse/SseClient.ts";
import {InnerEditor} from "../../core/AiEditor.ts";
import {GiteeModelConfig} from "./GiteeModelConfig.ts";


export class GiteeAiModel extends AiModel {

    constructor(editor: InnerEditor, globalConfig: AiGlobalConfig) {
        super(editor, globalConfig, "gitee");
        this.aiModelConfig = {
            top_p: 0.7,
            top_k: 50,
            ...globalConfig.models["gitee"]
        } as GiteeModelConfig;
    }

    createAiClient(url: string, listener: AiMessageListener): AiClient {
        const config = this.aiModelConfig as GiteeModelConfig;
        return new SseClient({
            url,
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.apiKey}`,
            }
        }, {
            onStart: listener.onStart,
            onStop: listener.onStop,
            onMessage: (bodyString: string) => {
                let message = null;
                try {
                    message = JSON.parse(bodyString);
                } catch (err) {
                    console.error("error", err, bodyString);
                    return;
                }

                listener.onMessage({
                    status: message.choices[0].finish_reason === "stop" ? 2 : 1,
                    role: "assistant",
                    content: message.choices[0].delta?.content || "",
                    index: message.choices[0].index,
                })
                //通知 ai 消费情况
                if (this.globalConfig.onTokenConsume && message.usage?.["total_tokens"]) {
                    this.globalConfig.onTokenConsume(this.aiModelName, this.aiModelConfig!, message.usage["total_tokens"])
                }
            }
        });
    }

    wrapPayload(prompt: string) {
        const config = this.aiModelConfig as GiteeModelConfig;
        const payload = {
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            stream: true,
            max_tokens: config.maxTokens || null,
            temperature: config.temperature || null,
            top_p: config.top_p,
            top_k: config.top_k,
        }
        return JSON.stringify(payload);
    }

    createAiClientUrl(): string {
        const {endpoint} = this.aiModelConfig as GiteeModelConfig;
        return endpoint;
    }


}
