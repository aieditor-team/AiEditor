import {AiModel} from "../AiModel.ts";
import {AiEditorOptions} from "../../core/AiEditor.ts";
import {Editor} from "@tiptap/core";
import {XingHuoSocket} from "./XingHuoSocket.ts";
// @ts-ignore
import hmacSHA256 from 'crypto-js/hmac-sha256';
// @ts-ignore
import Base64 from 'crypto-js/enc-base64';

export class XingHuoModel implements AiModel {

    protocol: string;
    appId: string;
    apiKey: string;
    apiSecret: string;
    version: string;
    urlSignatureAlgorithm:(model:XingHuoModel)=>string;

    constructor(options: AiEditorOptions) {
        const {protocol, appId, apiKey, apiSecret, version,urlSignatureAlgorithm} = options.ai?.model.xinghuo!;
        this.protocol = protocol || "ws";
        this.appId = appId;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.version = version || "v3.1";
        this.urlSignatureAlgorithm = urlSignatureAlgorithm!;
    }

    start(seletedText: string, prompt: string, editor: Editor,getText:boolean = false): void {
        const url = this.urlSignatureAlgorithm ? this.urlSignatureAlgorithm(this) : this.createUrl();
        const socket = new XingHuoSocket(url, this.appId, this.version, editor,getText);
        socket.start(`"${seletedText}"\n${prompt}`)
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