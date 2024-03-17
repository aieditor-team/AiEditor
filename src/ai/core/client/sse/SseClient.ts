import {AiClientListener} from "../../AiClientListener.ts";
import {AiClient} from "../../AiClient.ts";
import {fetchEventSource} from "@microsoft/fetch-event-source";

type configType = { url: string, method: string }

export class SseClient implements AiClient {
    isStop: boolean = false
    config: configType;
    fetch?: Response;
    isOpen: boolean = false;
    message?: string;
    listener: AiClientListener;
    ctrl = new AbortController();

    constructor(config: configType, listener: AiClientListener) {
        this.config = config;
        this.listener = listener;
    }


    start(message: string) {
        this.message = message;
        this.onOpen()
        this.listener.onStart(this);
    }

    stop() {
        if (this.fetch) {
            // 取消请求
            this.ctrl.abort();

            if (!this.isStop) {
                this.listener.onStop();
                this.isStop = true;
            }
        }
    }

    async send(message: string) {
        if (this.isOpen) {
            try {
                fetchEventSource(this.config.url, {
                    method: this.config.method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: message,
                    signal: this.ctrl.signal,
                    onclose: this.onClose,
                    onerror: this.onError,
                    onmessage: (msg) => {
                        if (msg.event === 'FatalError') {
                            this.onError();
                        } else {
                            this.onMessage(msg.data)
                        }
                    }
                });
            } catch {
                this.onError()
            }
        }
    }

    protected onOpen() {
        this.isOpen = true;
        this.send(this.message!);
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