import {AiClientListener} from "../../AiClientListener.ts";
import {AiClient} from "../../AiClient.ts";
import {events} from "fetch-event-stream";

type SSEConfig = { url: string, method: string, headers?: Record<string, any> }

export class SseClient implements AiClient {
    isStop: boolean = false
    config: SSEConfig;
    fetch?: Response;
    isOpen: boolean = false;
    payload?: string;
    listener: AiClientListener;
    ctrl = new AbortController();

    constructor(config: SSEConfig, listener: AiClientListener) {
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
            this.ctrl.abort();

            if (!this.isStop) {
                this.listener.onStop();
                this.isStop = true;
            }
        }
    }

    async send(payload: string) {
        let res = await fetch(this.config.url, {
            method: this.config.method,
            signal: this.ctrl.signal,
            headers: this.config.headers,
            body: payload,
        });

        if (!res.ok) {
            this.onError();
            return;
        }

        try {
            let msgEvents = events(res, this.ctrl.signal);
            for await (let event of msgEvents) {
                if (event.data && "[DONE]" !== event.data.trim()) {
                    this.onMessage(event.data)
                }
            }
        } catch (err) {
            console.error("error", err);
            this.onError()
        } finally {
            this.onClose();
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
