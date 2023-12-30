import {AiModelConfig} from "../core/AiModelConfig.ts";

export interface SparkAiModelConfig extends AiModelConfig {
    appId: string,
    apiKey: string,
    apiSecret: string,
    protocol?: string,
    version?: string,
}
