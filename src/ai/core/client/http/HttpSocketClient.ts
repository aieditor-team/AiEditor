import { AiClientListener } from "../../AiClientListener.ts";
import { AiClient } from "../../AiClient.ts";

type configType = { url: string, method: string, headers?: Record<string, any> }
export class HttpStreamSocketClient implements AiClient {
    isStop: boolean = false
    config: configType;
    fetch?: Response;
    isOpen: boolean = false;
    payload?: string;
    listener: AiClientListener;

    constructor(config: configType, listener: AiClientListener) {
        this.config = config;
        this.listener = listener;
    }


    start(payload: string) {
        this.payload = payload;
        this.onOpen()
        this.listener.onStart(this);
    }

    stop() {
        if (this.fetch) {
            // 取消请求
            this.fetch = void 0;

            if (!this.isStop) {
                this.listener.onStop();
                this.isStop = true;
            }
        }
    }

    async send(payload: string) {
        if (this.isOpen) {
            try {
                this.fetch = await fetch(this.config.url, { method: this.config.method, headers: this.config.headers, body: payload })
                const response = this.fetch
                if (!response.body) throw new Error("response.body is none")

                const processText = ({ done, value }: { done: boolean, value: any }): any => {
                    if (done) {
                        this.onClose()
                        return;
                    }
                    this.onMessage(decoder.decode(value))
                    // Continue reading  
                    return reader.read().then(({ done, value }) => processText({ done, value }));
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                reader.read().then(({ done, value }) => processText({ done, value }));
            } catch {
                this.onError()
            }
        }
    }

    protected onOpen() {
        this.isOpen = true;
        this.send(this.payload!);
    }

    protected onMessage(answer: string) {
        this.listener.onMessage(answer)
    }

    protected onClose() {
        this.isOpen = false;
        if (!this.isStop) {
            this.listener.onStop();
            this.isStop = true;
        }
    }

    protected onError() {
        this.isOpen = false;
        if (!this.isStop) {
            this.listener.onStop();
            this.isStop = true;
        }
    }
}