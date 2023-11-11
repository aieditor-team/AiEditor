import {AbstractWebSocket} from "../AbstractWebSocket.ts";
import {Editor} from "@tiptap/core";

// @ts-ignore
import hmacSHA256 from 'crypto-js/hmac-sha256';
// @ts-ignore
import Base64 from 'crypto-js/enc-base64';
import {uuid} from "../../util/uuid.ts";

export class XingHuoSocket extends AbstractWebSocket {

    appId: string;
    version: string;
    editor: Editor;


    constructor(appId: string, apiKey: string, apiSecret: string, version: string, editor: Editor) {
        super(XingHuoSocket.createUrl(apiKey, apiSecret, version));
        this.appId = appId;
        this.version = version;
        this.editor = editor;
    }

    static createUrl(apiKey: string, apiSecret: string, version: string): string {
        const date = new Date().toUTCString().replace("GMT", "+0000");
        let header = "host: spark-api.xf-yun.com\n"
        header += "date: " + date + "\n"
        header += `GET /${version}/chat HTTP/1.1`
        const hmacSHA = hmacSHA256(header, apiSecret);
        const base64 = Base64.stringify(hmacSHA)
        const authorization_origin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${base64}"`
        const authorization = btoa(authorization_origin);
        return `ws://spark-api.xf-yun.com/${version}/chat?authorization=${authorization}&date=${encodeURIComponent(date)}&host=spark-api.xf-yun.com`
    }

    getDomain() {
        switch (this.version) {
            case "v3.1":
                return "generalv3"
            case "v2.1":
                return "generalv2"
            default:
                return "general"
        }
    }

    send(message: string) {
        const object = {
            "header": {
                "app_id": this.appId,
                "uid": uuid(),
            },
            "parameter": {
                "chat": {
                    "domain": this.getDomain(),
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
            {role: "user", content: message}
        )

        super.send(JSON.stringify(object));
    }


    protected onMessage(e: MessageEvent) {
        const data = e.data;
        // message data format https://www.xfyun.cn/doc/spark/Web.html#_1-%E6%8E%A5%E5%8F%A3%E8%AF%B4%E6%98%8E
        const message = JSON.parse(data) as any;
        const text = message.payload.choices.text[0].content as string;

        if (text) {
            for (let i = 0; i < text.length; i++) {
                const c = text.charAt(i);
                if ((i == 0 || i == text.length - 1) && c === '"') continue
                if (c === "\n") this.editor.commands.insertContent("<p></p>");
                else this.editor.commands.insertContent(c);
            }

            this.editor.commands.scrollIntoView();
        }
    }
}