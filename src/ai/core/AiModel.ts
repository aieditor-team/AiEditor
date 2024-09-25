import {AiMessageListener} from "./AiMessageListener.ts";
import {AiClient} from "./AiClient.ts";
import {AiGlobalConfig} from "../AiGlobalConfig.ts";
import {AiModelConfig} from "./AiModelConfig.ts";
import {InnerEditor} from "../../core/AiEditor.ts";


export abstract class AiModel {

    public editor: InnerEditor;
    public globalConfig: AiGlobalConfig;
    public aiModelName: string;
    public aiModelConfig: AiModelConfig;

    protected constructor(editor: InnerEditor, globalConfig: AiGlobalConfig, aiModelName: string) {
        this.editor = editor;
        this.globalConfig = globalConfig;
        this.aiModelName = aiModelName;
        this.aiModelConfig = globalConfig.models[aiModelName];
    }

    chatWithPayload(payload: any, listener: AiMessageListener): void {
        const onSuccess = (url: string) => {
            const aiClient = this.createAiClient(url, listener);
            aiClient.start(typeof payload === "string" ? payload : JSON.stringify(payload))
        }
        const onFailure = () => {
            listener?.onStop();
        }

        if (this.globalConfig.onCreateClientUrl) {
            this.globalConfig.onCreateClientUrl(this.aiModelName, this.aiModelConfig, onSuccess, onFailure)
        } else {
            onSuccess(this.createAiClientUrl())
        }
    }


    chat(selectedText: string, prompt: string, listener: AiMessageListener): void {
        const onSuccess = (url: string) => {
            const aiClient = this.createAiClient(url, listener);
            const finalPrompt = prompt.includes("{content}") ? prompt.split('{content}').join(selectedText) : `${selectedText ? selectedText + "\n" : ""}${prompt}`
            const payload = this.wrapPayload(finalPrompt);
            aiClient.start(typeof payload === "string" ? payload : JSON.stringify(payload))
        }

        const onFailure = () => {
            listener?.onStop();
        }

        if (this.globalConfig.onCreateClientUrl) {
            this.globalConfig.onCreateClientUrl(this.aiModelName, this.aiModelConfig, onSuccess, onFailure)
        } else {
            onSuccess(this.createAiClientUrl())
        }
    }


    /**
     * 创建客户端链接 URL
     */
    abstract createAiClientUrl(): string;

    /**
     * 创建客户端
     */
    abstract createAiClient(url: string, listener: AiMessageListener): AiClient;

    /**
     * 封装消息，把 prompt 转换为协议需要的格式
     * @param prompt
     */
    abstract wrapPayload(prompt: string): any;


}