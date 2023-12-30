import {AiModel} from "./core/AiModel.ts";
import {AiGlobalConfig} from "./core/AiGlobalConfig.ts";
import {SparkAiModel} from "./spark/SparkAiModel.ts";
import {Editor} from "@tiptap/core";

export class AiModelFactory {

    private static models: Record<string, AiModel> = {};

    static init(editor: Editor, globalConfig: AiGlobalConfig) {
        if (globalConfig && globalConfig.models) {
            for (let key of Object.keys(globalConfig.models)) {
                switch (key) {
                    case "spark":
                        this.models[key] = new SparkAiModel(editor, globalConfig)
                }
            }
        }
    }

    static get(modelName: string): AiModel {
        return this.models[modelName];
    }
}