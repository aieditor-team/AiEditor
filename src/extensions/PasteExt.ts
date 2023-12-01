import {Plugin} from 'prosemirror-state'
import {Extension} from "@tiptap/core";
import {PluginKey} from "@tiptap/pm/state";
import {InnerEditor} from "../core/AiEditor.ts";
import {Slice} from '@tiptap/pm/model';

export const PasteExt = Extension.create({
    name: 'paste',
    priority: 100,

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
                        const html = event.clipboardData.getData('text/html');
                        const markdown = event.clipboardData.getData('text/markdown');

                        // const files = Array.from(event.clipboardData.files);
                        // const vscode = event.clipboardData.getData('vscode-editor-data');


                        // console.log("paste files: ",files)
                        // console.log("paste text: ",text)
                        // console.log("paste html: ",html)
                        // console.log("paste vscode: ",vscode)
                        // console.log("paste node: ",node)
                        // console.log("paste markdownText: ",markdownText)

                        const {state, dispatch} = view;

                        if (!html && (text || markdown)) {
                            const parseMarkdown = (this.editor as InnerEditor).parseMarkdown(text || markdown);
                            if (parseMarkdown) {
                                dispatch(state.tr.replaceSelection(new Slice(parseMarkdown, 0, 0)).scrollIntoView());
                                return true;
                            }
                        }
                    }
                }
            }),
        ]
    },


})