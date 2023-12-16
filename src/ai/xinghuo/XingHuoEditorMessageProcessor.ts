import {AiMessageProcessor} from "../AiMessageProcessor.ts";
import {Editor} from "@tiptap/core";
import {InnerEditor} from "../../core/AiEditor.ts";
import {AiModelParseOptions} from "../AiModel.ts";
import {getText} from "../../util/getText.ts";

export class XingHuoEditorMessageProcessor implements AiMessageProcessor {

    editor: Editor;
    from: number;
    options: AiModelParseOptions;

    constructor(editor: Editor, options?: AiModelParseOptions) {
        this.editor = editor;
        this.from = editor.view.state.selection.from;
        this.options = options || {
            markdownParseEnable: true
        };
    }

    onMessage(data: string) {
// message data format https://www.xfyun.cn/doc/spark/Web.html#_1-%E6%8E%A5%E5%8F%A3%E8%AF%B4%E6%98%8E
        const message = JSON.parse(data) as any;
        let text = message.payload.choices.text[0].content as string;
        if (text) {
            const {state: {tr}, view} = this.editor!
            view.dispatch(tr.insertText(text));
            if (message.header.status == 2) {
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
    };

}