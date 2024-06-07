import {AiModelConfig} from "../core/AiModelConfig.ts";

export interface OpenaiModelConfig extends AiModelConfig {
    endpoint?: string,
    apiKey: string,
    model?: string
}
