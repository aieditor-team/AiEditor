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

                        if (!html && text) {
                            const parseMarkdown = (this.editor as InnerEditor).parseMarkdown(text);
                            if (parseMarkdown) {
                                const {state: {tr}, dispatch} = view;
                                dispatch(tr.replaceSelection(new Slice(parseMarkdown, 0, 0)).scrollIntoView());
                                return true;
                            }
                        }
                    }
                }
            }),
        ]
    },


})