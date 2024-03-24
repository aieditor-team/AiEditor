import {AiClientListener} from "../../AiClientListener.ts";
import {AiClient} from "../../AiClient.ts";

type configType = { url: string, method: string, headers?: Record<string, any> }

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
                const response = await fetch(this.config.url,
                    {
                        method: this.config.method || "POST",
                        headers: this.config.headers,
                        body: message
                    }
                );
                if (!response.ok) {
                    this.onError();
                    return
                }
                const reader = response.body?.getReader();
                if (!reader) {
                    this.onError();
                    return
                }
                const decoder = new TextDecoder("utf-8");
                while (true) {
                    let {value, done} = await reader.read();
                    if (done) {
                        this.onClose();
                        break;
                    }
                    let responseText = decoder.decode(value);
                    if (!responseText) {
                        return;
                    }

                    const lines = responseText.split("\n\n");
                    let fullMessage = "";
                    let index = 0;
                    for (let line of lines) {
                        if (line.indexOf("data:") == 0) {
                            if (fullMessage) {
                                this.onMessage(fullMessage);
                            }
                            fullMessage = line.substring(5);
                        } else {
                            if (index != lines.length - 1) {
                                fullMessage += "\n\n";
                            }
                            fullMessage += line;
                        }
                        index++
                    }
                    if (fullMessage) {
                        this.onMessage(fullMessage);
                    }
                }
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