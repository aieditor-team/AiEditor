import {AiMessageProcessor} from "./AiMessageProcessor.ts";
import {AiModelListener} from "./AiModelListener.ts";

export class AbstractWebSocket {

    url: string;
    processor: AiMessageProcessor;
    webSocket?: WebSocket;
    isOpen: boolean = false;
    text?: string;
    listeners: AiModelListener[] = [];

    constructor(url: string, processor: AiMessageProcessor) {
        this.url = url;
        this.processor = processor;
    }

    addListener(listener: AiModelListener) {
        this.listeners.push(listener);
    }

    start(text: string) {
        for (let listener of this.listeners) {
            listener.onStart();
        }

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

            for (let listener of this.listeners) {
                listener.onStop();
            }
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
        if (this.processor) {
            this.processor.onMessage(_.data);
        }
    }

    protected onClose(_: CloseEvent) {
        this.isOpen = false;
        for (let listener of this.listeners) {
            listener.onStop();
        }
    }

    protected onError(_: Event) {
        this.isOpen = false;
        for (let listener of this.listeners) {
            listener.onStop();
        }
    }
}