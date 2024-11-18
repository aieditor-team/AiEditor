import {AiModelConfig} from "../core/AiModelConfig.ts";

export interface OpenaiModelConfig extends AiModelConfig {
    endpoint?: string,
    customUrl?: string | (() => string),
    apiKey?: string,
    model?: string
}
