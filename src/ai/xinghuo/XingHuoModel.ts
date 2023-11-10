import {AiModel} from "../AiModel.ts";
import {AiEditorOptions} from "../../core/AiEditor.ts";
import {Editor} from "@tiptap/core";
import {XingHuoSocket} from "./XingHuoSocket.ts";

export class XingHuoModel implements AiModel {

    appId: string;
    apiKey: string;
    apiSecret: string;
    version: string;

    constructor(options: AiEditorOptions) {
        const {appId, apiKey, apiSecret, version} = options.ai?.model.xinghuo!;
        this.appId = appId;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.version = version || "v3.1";
    }

    start(seletedText: string, prompt: string, editor: Editor): void {
        const socket = new XingHuoSocket(this.appId, this.apiKey, this.apiSecret, this.version, editor);
        socket.start(`"${seletedText}"\n${prompt}`)
    }

}