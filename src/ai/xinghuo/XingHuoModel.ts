import {AiModel, AiModelParseOptions} from "../AiModel.ts";
import {AiEditorOptions} from "../../core/AiEditor.ts";
import {Editor} from "@tiptap/core";
import {XingHuoSocket} from "./XingHuoSocket.ts";
// @ts-ignore
import hmacSHA256 from 'crypto-js/hmac-sha256';
// @ts-ignore
import Base64 from 'crypto-js/enc-base64';
import {XingHuoEditorMessageProcessor} from "./XingHuoEditorMessageProcessor.ts";
import {AiMessageProcessor} from "../AiMessageProcessor.ts";

export class XingHuoModel implements AiModel {

    protocol: string;
    appId: string;
    apiKey: string;
    apiSecret: string;
    version: string;
    urlSignatureAlgorithm: (model: XingHuoModel) => string;

    constructor(options: AiEditorOptions) {
        const {protocol, appId, apiKey, apiSecret, version, urlSignatureAlgorithm} = options.ai?.model.xinghuo!;
        this.protocol = protocol || "ws";
        this.appId = appId;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.version = version || "v3.1";
        this.urlSignatureAlgorithm = urlSignatureAlgorithm!;
    }

    start(selectedText: string, prompt: string, editor: Editor, options?: AiModelParseOptions): void {
        this.startWithProcessor(selectedText, prompt,  new XingHuoEditorMessageProcessor(editor, options));
    }

    startWithProcessor(selectedText: string, prompt: string,  processor: AiMessageProcessor): void {
        const url = this.urlSignatureAlgorithm ? this.urlSignatureAlgorithm(this) : this.createUrl();
        const socket = new XingHuoSocket(url, processor, this.appId, this.version);
        socket.start(`${selectedText}\n${prompt}`)
    }


    createUrl(): string {
        const date = new Date().toUTCString().replace("GMT", "+0000");
        let header = "host: spark-api.xf-yun.com\n"
        header += "date: " + date + "\n"
        header += `GET /${this.version}/chat HTTP/1.1`
        const hmacSHA = hmacSHA256(header, this.apiSecret);
        const base64 = Base64.stringify(hmacSHA)
        const authorization_origin = `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${base64}"`
        const authorization = btoa(authorization_origin);
        return `${this.protocol}://spark-api.xf-yun.com/${this.version}/chat?authorization=${authorization}&date=${encodeURIComponent(date)}&host=spark-api.xf-yun.com`
    }


}