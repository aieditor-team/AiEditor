import {AiModelConfig} from "../core/AiModelConfig.ts";

export interface WenXinAiModelConfig extends AiModelConfig {
    access_token: string,
    protocol?: string,
    version?: string
}
