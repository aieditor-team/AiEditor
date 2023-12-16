import {AiEditorOptions} from "../core/AiEditor.ts";
import {AiModel} from "./AiModel.ts";
import {XingHuoModel} from "./xinghuo/XingHuoModel.ts";

export class AiModelFactory {

    static models: Record<string, AiModel> = {};

    static create(modelName: string, options: AiEditorOptions): AiModel | null {
        let model = this.models[modelName];
        if (model) return model;

        if (modelName === "xinghuo") {
            model = new XingHuoModel(options);
        }

        if (model) {
            this.models[modelName] = model;
        }
        return model;
    }
}