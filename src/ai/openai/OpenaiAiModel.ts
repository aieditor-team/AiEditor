import {AiClient} from "../core/AiClient.ts";
import {AiMessageListener} from "../core/AiMessageListener.ts";
import {AiModel} from "../core/AiModel.ts";
import {AiGlobalConfig} from "../AiGlobalConfig.ts";
import {OpenaiModelConfig} from "./OpenaiModelConfig.ts";
import {SseClient} from "../core/client/sse/SseClient.ts";
import {InnerEditor} from "../../core/AiEditor.ts";


export class OpenaiAiModel extends AiModel {

    constructor(editor: InnerEditor, globalConfig: AiGlobalConfig) {
        super(editor, globalConfig, "openai");
        this.aiModelConfig = {
            endpoint: "https://api.openai.com",
            model: "gpt-3.5-turbo",
            ...globalConfig.models["openai"]
        } as OpenaiModelConfig;
    }

    createAiClient(url: string, listener: AiMessageListener): AiClient {
        const config = this.aiModelConfig as OpenaiModelConfig;
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
                if (this.globalConfig.onTokenConsume && message.choices[0].usage?.["total_tokens"]) {
                    this.globalConfig.onTokenConsume(this.aiModelName, this.aiModelConfig!, message.choices[0].usage["total_tokens"])
                }
            }
        });
    }

    wrapPayload(prompt: string) {
        const config = this.aiModelConfig as OpenaiModelConfig;
        const payload = {
            "model": config.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "max_tokens": config.maxTokens || null,
            "temperature": config.temperature || null,
            "stream": true
        }
        return JSON.stringify(payload);
    }

    createAiClientUrl(): string {
        const config = this.aiModelConfig as OpenaiModelConfig;
        return `${config.endpoint}/v1/chat/completions`;
    }


}
