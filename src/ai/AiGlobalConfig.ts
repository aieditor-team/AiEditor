import {AiModelConfig} from "./core/AiModelConfig.ts";
import {AiModelFactory} from "./AiModelFactory.ts";
import {AIBubbleMenuItem, TranslateMenuItem} from "../components/bubbles/types.ts";
import {AiEditor} from "../core/AiEditor.ts";
import {OpenaiModelConfig} from "./openai/OpenaiModelConfig.ts";
import {GiteeModelConfig} from "./gitee/GiteeModelConfig.ts";
import {SparkAiModelConfig} from "./spark/SparkAiModelConfig.ts";
import {CustomAiModelConfig} from "./custom/CustomAiModelConfig.ts";
import {WenXinAiModelConfig} from "./wenxin/WenXinAiModelConfig.ts";

export interface AiMenu {
    icon: string,
    name: string,
    prompt?: string,
    text?: "selected" | "focusBefore",
    model?: string,
    onClick?: (event: MouseEvent, editor: AiEditor) => void,
    children?: AiMenu[],
}


export interface AiGlobalConfig {
    models?: {
        openai?: OpenaiModelConfig,
        gitee?: GiteeModelConfig,
        spark?: SparkAiModelConfig,
        wenxin?: WenXinAiModelConfig,
        custom?: CustomAiModelConfig,
    },
    modelFactory?: AiModelFactory,
    onTokenConsume?: (modelName: string, modelConfig: AiModelConfig, count: number) => void,
    onCreateClientUrl?: (modelName: string, modelConfig: AiModelConfig, onSuccess: (url: string) => void, onFailure: () => void) => void
    bubblePanelEnable?: boolean,
    bubblePanelModel?: string,
    bubblePanelMenus?: AIBubbleMenuItem[],
    bubblePanelIcon?: string,
    menus?: AiMenu[],
    commands?: AiMenu[],
    translate?: {
        prompt?: (language: string, selectText: string) => string,
        translateMenuItems?: TranslateMenuItem[],
    },
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
