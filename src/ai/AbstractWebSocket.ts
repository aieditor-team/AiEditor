import {AiMessageProcessor} from "./AiMessageProcessor.ts";

export class AbstractWebSocket {

    url: string;
    processor: AiMessageProcessor;
    webSocket?: WebSocket;
    isOpen: boolean = false;
    text?: string;

    constructor(url: string, processor:AiMessageProcessor) {
        this.url = url;
        this.processor = processor;
    }

    start(text: string) {
        this.text = text;
        this.webSocket = new WebSocket(this.url);
        this.webSocket.onopen = (e) => this.onOpen(e)
        this.webSocket.onmessage = (e) => this.onMessage(e)
        this.webSocket.onclose = (e) => this.onClose(e)
        this.webSocket.onerror = (e) => this.onError(e)
    }

    stop() {
        if (this.webSocket) {
            this.webSocket.close();
            this.webSocket = void 0;
        }
    }

    send(message: string) {
        if (this.webSocket && this.isOpen) {
            this.webSocket.send(message);
        }
    }

    protected onOpen(_: Event) {
        this.isOpen = true;
        this.send(this.text!);
    }

    protected onMessage(_: MessageEvent) {
        if (this.processor){
            this.processor.onMessage(_.data);
        }
    }

    protected onClose(_: CloseEvent) {
        this.isOpen = false;
    }

    protected onError(_: Event) {
        this.isOpen = false;
    }
}