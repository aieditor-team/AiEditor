import {AbstractWebSocket} from "../AbstractWebSocket.ts";
import {uuid} from "../../util/uuid.ts";
import {AiMessageProcessor} from "../AiMessageProcessor.ts";


export class XingHuoSocket extends AbstractWebSocket {
    appId: string;
    version: string;

    constructor(url: string, processor:AiMessageProcessor, appId: string, version: string) {
        super(url,processor);
        this.appId = appId;
        this.version = version;
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

}