import {AiModelConfig} from "./core/AiModelConfig.ts";

export interface AiMenu {
    icon: string,
    name: string,
    prompt?: string,
    text?: "selected" | "focusBefore",
    model?: string,
    children?: AiMenu[],
}


export interface AiGlobalConfig {
    models: Record<string, AiModelConfig>,
    onTokenConsume?: (modelName: string, modelConfig: AiModelConfig, count: number) => void,
    onCreateClientUrl?: (modelName: string, modelConfig: AiModelConfig, onFinished: (url: string) => void) => void,
    bubblePanelEnable?: boolean,
    bubblePanelModel?: string,
    menus?: AiMenu[],
    commands?: AiMenu[],
    codeBlock?: {
        codeComments?: {
            model: string,
            prompt: string,
        },
        codeExplain?: {
            model: string,
            prompt: string,
        }
    }
}
