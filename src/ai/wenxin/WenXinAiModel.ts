import {AiClient} from "../core/AiClient.ts";
import {AiMessageListener} from "../core/AiMessageListener.ts";
import {AiModel} from "../core/AiModel.ts";
import {HttpStreamSocketClient} from "../core/client/http/HttpSocketClient.ts";
import {AiGlobalConfig} from "../AiGlobalConfig.ts";
import {WenXinAiModelConfig} from "./WenXinAiModelConfig.ts";
import {InnerEditor} from "../../core/AiEditor.ts";


export class WenXinAiModel extends AiModel {

    constructor(editor: InnerEditor, globalConfig: AiGlobalConfig) {
        super(editor, globalConfig, "wenxin");
        this.aiModelConfig = {
            ...globalConfig.models["wenxin"]
        } as WenXinAiModelConfig;
    }

    createAiClient(url: string, listener: AiMessageListener): AiClient {
        return new HttpStreamSocketClient({url, method: "POST"}, {
            onStart: listener.onStart,
            onStop: listener.onStop,

            onMessage: (bodyString: string) => {
                const dataMatch = bodyString.match(/data:([\s\S]*)$/)
                if (!dataMatch) return
                const message = JSON.parse(dataMatch[1]) as any;

                listener.onMessage({
                    status: message.is_end ? 2 : 1,
                    role: "assistant",
                    content: message.result || "",
                    index: message.sentence_id
                })
            }
        })
    }

    wrapPayload(prompt: string) {
        const object = {
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            "stream": true,
            "max_tokens": this.aiModelConfig.maxTokens || null,
            "temperature": this.aiModelConfig.temperature || null,
        }
        return JSON.stringify(object);
    }

    createAiClientUrl(): string {
        const config = this.aiModelConfig as WenXinAiModelConfig;
        return `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${config.access_token}`
    }


}
