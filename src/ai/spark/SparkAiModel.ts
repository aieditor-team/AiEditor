import {AiClient} from "../core/AiClient.ts";
import {AiMessageListener} from "../core/AiMessageListener.ts";
import {AiModel} from "../core/AiModel.ts";
import {WebSocketClient} from "../core/client/ws/WebSocketClient.ts";
import {AiGlobalConfig} from "../AiGlobalConfig.ts";
import {Editor} from "@tiptap/core";
import {SparkAiModelConfig} from "./SparkAiModelConfig.ts";

// @ts-ignore
import hmacSHA256 from 'crypto-js/hmac-sha256';
// @ts-ignore
import Base64 from 'crypto-js/enc-base64';
import {uuid} from "../../util/uuid.ts";

export class SparkAiModel extends AiModel {

    constructor(editor: Editor, globalConfig: AiGlobalConfig) {
        super(editor, globalConfig, "spark");
        this.aiModelConfig = {
            version: "v3.1",
            protocol: "wss",
            ...globalConfig.models["spark"]
        } as SparkAiModelConfig;
    }

    createAiClient(url: string, listener: AiMessageListener): AiClient {
        return new WebSocketClient(url, {
            onStart: listener.onStart,
            onStop: listener.onStop,
            // 星火内容解析 https://www.xfyun.cn/doc/spark/Web.html#_1-%E6%8E%A5%E5%8F%A3%E8%AF%B4%E6%98%8E
            onMessage: (messageData: any) => {
                const message = JSON.parse(messageData) as any;
                if (message.payload) {
                    //通知 ai 消费情况
                    if (message.payload.usage?.text?.total_tokens) {
                        if (this.globalConfig.onTokenConsume) {
                            this.globalConfig.onTokenConsume(this.aiModelName, this.aiModelConfig!, message.payload.usage?.text?.total_tokens)
                        }
                    }

                    // 通知 AiMessageListener
                    if (message.payload.choices?.text) {
                        if (message.payload.choices.text[0]) {
                            listener.onMessage({
                                ...message.payload.choices.text[0],
                                status: message.payload.choices.status,
                            })
                        }
                    }
                }
            }
        })
    }

    wrapMessage(promptMessage: string) {
        const sparkAiModelConfig = this.aiModelConfig as SparkAiModelConfig;
        const object = {
            "header": {
                "app_id": sparkAiModelConfig.appId,
                "uid": uuid(),
            },
            "parameter": {
                "chat": {
                    "domain": this.getDomain(sparkAiModelConfig),
                    "temperature": 0.5,
                    "max_tokens": 2048,
                }
            },
            "payload": {
                "message": {
                    "text": [
                        // {"role": "user", "content": "你会做什么"}
                    ] as any[]
                }
            }
        }

        object.payload.message.text.push(
            {role: "user", content: promptMessage}
        )

        return JSON.stringify(object);
    }


    private getDomain(sparkAiModelConfig: SparkAiModelConfig) {
        switch (sparkAiModelConfig.version) {
            case "v3.5":
                return "generalv3.5"
            case "v3.1":
                return "generalv3"
            case "v2.1":
                return "generalv2"
            default:
                return "general"
        }
    }

    createAiClientUrl(): string {
        const sparkAiModelConfig = this.aiModelConfig as SparkAiModelConfig;
        const date = new Date().toUTCString().replace("GMT", "+0000");
        let header = "host: spark-api.xf-yun.com\n"
        header += "date: " + date + "\n"
        header += `GET /${sparkAiModelConfig.version}/chat HTTP/1.1`
        const hmacSHA = hmacSHA256(header, sparkAiModelConfig.apiSecret);
        const base64 = Base64.stringify(hmacSHA)
        const authorization_origin = `api_key="${sparkAiModelConfig.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${base64}"`
        const authorization = btoa(authorization_origin);
        return `${sparkAiModelConfig.protocol}://spark-api.xf-yun.com/${sparkAiModelConfig.version}/chat?authorization=${authorization}&date=${encodeURIComponent(date)}&host=spark-api.xf-yun.com`
    }


}