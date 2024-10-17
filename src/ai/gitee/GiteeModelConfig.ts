import {AiModelConfig} from "../core/AiModelConfig.ts";

export interface GiteeModelConfig extends AiModelConfig {
    endpoint: string,
    apiKey: string,
    top_p: number,
    top_k: number
}
