export class AbstractWebSocket {

    url: string;
    webSocket?: WebSocket;
    isOpen: boolean = false;
    text?: string;

    constructor(url: string) {
        this.url = url;
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
    }

    protected onClose(_: CloseEvent) {
        this.isOpen = false;
    }

    protected onError(_: Event) {
        this.isOpen = false;
    }
}