import {AiMessage} from "./AiMessage.ts";
import {AiMessageListener} from "./AiMessageListener.ts";
import {Editor} from "@tiptap/core";
import {InnerEditor} from "../../core/AiEditor.ts";
import {getText} from "../../util/getText.ts";

export interface AiMessageParserOptions {
    markdownParseEnable?: boolean,
    useMarkdownTextOnly?: boolean,
}

export class DefaultAiMessageListener implements AiMessageListener {
    editor: Editor;
    from: number;
    options: AiMessageParserOptions;

    constructor(editor: Editor, options?: AiMessageParserOptions) {
        this.editor = editor;
        this.from = editor.view.state.selection.from;
        this.options = options || {
            markdownParseEnable: true
        };
    }

    onStart() {
        //do nothing
    }

    onStop() {
        //do nothing
    }

    onMessage(message: AiMessage) {
        const {state: {tr}, view} = this.editor!
        view.dispatch(tr.insertText(message.content));
        if (message.status == 2) {
            if (this.options.markdownParseEnable) {
                const end = this.editor.state.selection.to;
                const insertedText = this.editor.state.doc.textBetween(this.from, end);
                const {state: {tr}, view} = this.editor!
                const parseMarkdown = (this.editor as InnerEditor).parseMarkdown(insertedText);
                if (this.options.useMarkdownTextOnly) {
                    const textString = getText(parseMarkdown);
                    const textNode = this.editor.schema.text(textString);
                    view.dispatch(tr.replaceWith(this.from, end, textNode).scrollIntoView());
                } else {
                    view.dispatch(tr.replaceWith(this.from, end, parseMarkdown).scrollIntoView());
                }
            }
        }
        this.editor.commands.scrollIntoView();
    }
}
