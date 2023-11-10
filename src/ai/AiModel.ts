import {Editor} from "@tiptap/core";

export interface AiModel {

    start: (seletedText: string, prompt: string, editor: Editor) => void,

}