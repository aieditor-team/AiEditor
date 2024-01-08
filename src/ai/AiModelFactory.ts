import {Editor} from "@tiptap/core";
import {AiGlobalConfig} from "./AiGlobalConfig.ts";
import {AiModel} from "./core/AiModel.ts";

export interface AiModelFactory {
    create: (name: string, editor: Editor, globalConfig: AiGlobalConfig) => AiModel;
}
