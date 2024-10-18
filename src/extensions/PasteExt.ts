import {Plugin} from 'prosemirror-state'
import {Extension} from "@tiptap/core";
import {PluginKey} from "@tiptap/pm/state";
import {InnerEditor} from "../core/AiEditor.ts";
import {Slice} from '@tiptap/pm/model';
import {cleanHtml, isExcelDocument, removeEmptyParagraphs, removeHtmlTags} from "../util/htmlUtil.ts";

export const PasteExt = Extension.create({
    name: 'pasteExt',
    priority: 1000,

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey("aie-paste"),
                props: {
                    handlePaste: (view, event) => {
                        if (view.props.editable && !view.props.editable(view.state)) {
                            return false;
                        }

                        if (!event.clipboardData) return false;

                        const text = event.clipboardData.getData('text/plain');
                        let html = event.clipboardData.getData('text/html');

                        if (!html && text) {
                            const parseMarkdown = (this.editor as InnerEditor).parseMarkdown(text);
                            if (parseMarkdown) {
                                const {state: {tr}, dispatch} = view;
                                dispatch(tr.replaceSelection(new Slice(parseMarkdown, 0, 0)).scrollIntoView());
                                return true;
                            }
                        } else if (html) {
                            const {options} = (this.editor as InnerEditor).aiEditor;
                            if (options.htmlPasteConfig) {
                                //pasteAsText
                                if (options.htmlPasteConfig.pasteAsText) {
                                    html = cleanHtml(html, ['p', 'br'], true)
                                }
                                //pasteClean
                                else if (options.htmlPasteConfig.pasteClean) {
                                    html = removeHtmlTags(html, ['a', 'span', 'strong', 'b', 'em', 'i', 'u']);
                                    const parser = new DOMParser();
                                    const document = parser.parseFromString(html, 'text/html');
                                    const workspace = document.documentElement.querySelector('body');
                                    if (workspace) {
                                        workspace?.querySelectorAll('*').forEach(el => {
                                            el.removeAttribute("style");
                                        })
                                        html = workspace?.innerHTML;
                                    }
                                }

                                //remove empty paragraphs
                                if (!(options.htmlPasteConfig.removeEmptyParagraphs === false)) {
                                    html = removeEmptyParagraphs(html)
                                }

                                //paste with custom processor
                                if (options.htmlPasteConfig.pasteProcessor) {
                                    html = options.htmlPasteConfig.pasteProcessor(html);
                                }

                                if (html) {
                                    this.editor.commands.insertContent(html);
                                    return true;
                                }
                            }
                            // process excel paste
                            else if (text && html) {
                                const parser = new DOMParser();
                                const document = parser.parseFromString(html, 'text/html');
                                const table = document.querySelector("table");
                                if (table && isExcelDocument(document)) {
                                    this.editor.commands.insertContent(table!.outerHTML, {
                                        parseOptions: {
                                            preserveWhitespace: false,
                                        }
                                    });
                                    return true
                                }
                            }
                        }
                    }
                }
            }),
        ]
    },
})
