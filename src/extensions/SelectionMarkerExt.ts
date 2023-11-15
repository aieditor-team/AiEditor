import {Extension} from '@tiptap/core'
import {Plugin, PluginKey} from '@tiptap/pm/state';
import {Decoration, DecorationSet} from '@tiptap/pm/view';


export const SelectionMarkerExt = Extension.create({
    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey("selection-marker"),
                state: {
                    init: () => DecorationSet.empty,
                    apply: (tr, set, state) => {
                        const {selection} = tr;
                        if (selection) {
                            const decos = [Decoration.inline(selection.$from.pos, selection.$to.pos,
                                {class: 'selection-marker'},
                                {inclusiveLeft: true, inclusiveRight: true}
                            )];
                            return DecorationSet.create(state.doc, decos);
                        }
                        return set;
                    }
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    }
                }
            }),
        ]
    },
})