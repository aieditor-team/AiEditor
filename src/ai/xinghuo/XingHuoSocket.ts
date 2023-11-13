import {AbstractWebSocket} from "../AbstractWebSocket.ts";
import {Editor} from "@tiptap/core";


import {uuid} from "../../util/uuid.ts";

export class XingHuoSocket extends AbstractWebSocket {

    appId: string;
    version: string;
    editor: Editor;


    constructor(url:string,appId: string,version:string, editor: Editor) {
        super(url);
        this.appId = appId;
        this.version = version;
        this.editor = editor;
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