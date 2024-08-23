import {AiModel} from "./core/AiModel.ts";
import {AiGlobalConfig} from "./AiGlobalConfig.ts";
import {SparkAiModel} from "./spark/SparkAiModel.ts";
import {WenXinAiModel} from "./wenxin/WenXinAiModel.ts";
import {CustomAiModel} from "./custom/CustomAiModel.ts";
import {OpenaiAiModel} from "./openai/OpenaiAiModel.ts";
import {InnerEditor} from "../core/AiEditor.ts";
import {GiteeAiModel} from "./gitee/GiteeAiModel.ts";

export class AiModelManager {

    private static models: Record<string, AiModel> = {};

    static init(editor: InnerEditor, globalConfig: AiGlobalConfig) {
        if (globalConfig && globalConfig.models) {
            for (let key of Object.keys(globalConfig.models)) {
                switch (key) {
                    case "spark":
                        this.set(key, new SparkAiModel(editor, globalConfig))
                        break;
                    case "wenxin":
                        this.set(key, new WenXinAiModel(editor, globalConfig))
                        break;
                    case "openai":
                        this.set(key, new OpenaiAiModel(editor, globalConfig))
                        break;
                    case "gitee":
                        this.set(key, new GiteeAiModel(editor, globalConfig))
                        break;
                    case "custom":
                        this.set(key, new CustomAiModel(editor, globalConfig))
                        break;
                    default:
                        const aiModel = globalConfig.modelFactory?.create(key, editor, globalConfig);
                        if (aiModel) this.set(key, aiModel);
                }
            }
        }
    }

    static get(modelName: string): AiModel {
        if (!modelName || modelName === "auto") {
            modelName = Object.keys(this.models)[0];
        }
        return this.models[modelName];
    }

    static set(modelName: string, aiModel: AiModel) {
        this.models[modelName] = aiModel;
    }

}