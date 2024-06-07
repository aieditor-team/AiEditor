import {Node, mergeAttributes} from '@tiptap/core';

export const FigureExt = Node.create({
    name: 'figure',
    content: 'block+',
    group: 'block',
    defining: true,
    draggable: true,
    selectable: true,

    addOptions() {
        return {
            HTMLAttributes: {
                dir: 'auto',
            },
        };
    },

    parseHTML() {
        return [{tag: 'figure'}];
    },

    renderHTML({HTMLAttributes}) {
        return ['figure', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
});
