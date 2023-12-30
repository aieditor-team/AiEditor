import {AiClientListener} from "../../AiClientListener.ts";
import {AiClient} from "../../AiClient.ts";

export class WebSocketClient implements AiClient {

    isStop: boolean = false
    url: string;
    webSocket?: WebSocket;
    isOpen: boolean = false;
    message?: string;
    listener: AiClientListener;

    constructor(url: string, listener: AiClientListener) {
        this.url = url;
        this.listener = listener;
    }


    start(message: string) {
        this.listener.onStart(this);
        this.message = message;
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

            if (!this.isStop) {
                this.listener.onStop();
                this.isStop = true;
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
        this.send(this.message!);
    }

    protected onMessage(event: MessageEvent) {
        this.listener.onMessage(event.data)
    }

    protected onClose(_: CloseEvent) {
        this.isOpen = false;
        if (!this.isStop) {
            this.listener.onStop();
            this.isStop = true;
        }
    }

    protected onError(_: Event) {
        this.isOpen = false;
        if (!this.isStop) {
            this.listener.onStop();
            this.isStop = true;
        }
    }
}