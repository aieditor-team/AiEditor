import {AiModelConfig} from "../core/AiModelConfig.ts";

export interface GiteeModelConfig extends AiModelConfig {
    endpoint: string,
    apiKey: string,
    max_tokens: number,
    temperature: number,
    top_p: number,
    top_k: number
}
