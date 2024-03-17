import { AiClient } from "../core/AiClient.ts";
import { AiMessageListener } from "../core/AiMessageListener.ts";
import { AiModel } from "../core/AiModel.ts";
import { HttpStreamSocketClient } from "../core/client/http/HttpSocketClient.ts";
import { AiGlobalConfig } from "../AiGlobalConfig.ts";
import { Editor } from "@tiptap/core";
import { WenXinAiModelConfig } from "./WenXinAiModelConfig.ts";


export class WenXinAiModel extends AiModel {

    constructor(editor: Editor, globalConfig: AiGlobalConfig) {
        super(editor, globalConfig, "wenxin");
        this.aiModelConfig = {
            ...globalConfig.models["wenxin"]
        } as WenXinAiModelConfig;
    }

    createAiClient(url: string, listener: AiMessageListener): AiClient {
        return new HttpStreamSocketClient({ url, method: "POST" }, {
            onStart: listener.onStart,
            onStop: listener.onStop,

            onMessage: (messageData: any) => {
                const dataMatch = messageData.match(/data:([\s\S]*)$/)
                if (!dataMatch) return
                const message = JSON.parse(dataMatch[1]) as any;

                listener.onMessage({
                    status: message.is_end ? 2 : 1,
                    role: "",
                    content: message.result,
                    index: message.sentence_id
                })
            }
        })
    }

    wrapMessage(promptMessage: string) {
        const object = {
            messages: [] as any[],
            "stream": true
        }

        object.messages.push({ role: "user", content: promptMessage })
        return JSON.stringify(object);
    }

    createAiClientUrl(): string {
        const wenxinAiModelConfig = this.aiModelConfig as WenXinAiModelConfig;
        return `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${wenxinAiModelConfig.access_token}`
    }


}