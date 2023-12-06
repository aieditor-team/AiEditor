import {Editor} from "@tiptap/core";

export interface AiModelParseOptions {
    markdownParseEnable?: boolean,
    useMarkdownTextOnly?: boolean,
}

export interface AiModel {

    start: (seletedText: string, prompt: string, editor: Editor, options?: AiModelParseOptions) => void,

}