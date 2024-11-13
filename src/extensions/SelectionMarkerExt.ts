import {Extension} from '@tiptap/core'
import {Plugin, PluginKey} from '@tiptap/pm/state';
import {Decoration, DecorationSet} from '@tiptap/pm/view';


export const SelectionMarkerExt = Extension.create({
    addProseMirrorPlugins() {
        const e = this.editor;
        return [
            new Plugin({
                key: new PluginKey("selection-marker"),
                props: {
                    decorations(state) {
                        if (state.selection.empty || e.isFocused) {
                            return null;
                        }
                        return DecorationSet.create(state.doc, [
                            Decoration.inline(state.selection.from, state.selection.to,
                                {class: 'selection-marker'}
                            )
                        ])
                    }
                }
            }),
        ]
    },
})
