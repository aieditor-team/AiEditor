import {Editor} from "@tiptap/core";
import {AiMessageProcessor} from "./AiMessageProcessor.ts";

export interface AiModelParseOptions {
    markdownParseEnable?: boolean,
    useMarkdownTextOnly?: boolean,
}

export interface AiModel {

    start: (selectedText: string, prompt: string, editor: Editor, options?: AiModelParseOptions) => void,

    startWithProcessor: (selectedText: string, prompt: string, processor:AiMessageProcessor) => void,

}