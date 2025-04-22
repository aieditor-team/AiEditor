import {Command, Extension} from '@tiptap/core';
import {AllSelection, TextSelection, Transaction} from 'prosemirror-state';

export interface IndentOptions {
    types: string[];
    minLevel: number;
    maxLevel: number;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        indent: {
            indent: () => ReturnType;
            outdent: () => ReturnType;
        };
    }
}

export const IndentExt = Extension.create<IndentOptions>({
    name: 'indent',

    addOptions() {
        return {
            types: ['listItem', 'paragraph'],
            minLevel: 0,
            maxLevel: 8,
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    indent: {
                        default: 0,
                        parseHTML: element => {
                            let level = Number(element.getAttribute('data-indent'));
                            if (level) {
                                if (level > this.options.maxLevel) level = this.options.maxLevel;
                                else if (level < this.options.minLevel) level = this.options.minLevel;
                                return level;
                            } else {
                                const textIndent = element.style.textIndent;
                                let emValue = 0;
                                if (textIndent && textIndent.endsWith("pt")) {
                                    const ptValue = Number(textIndent.substring(0, textIndent.indexOf("pt")));
                                    emValue = ptValue * (96 / 72) / 16;
                                } else if (textIndent && textIndent.endsWith("em")) {
                                    emValue = Number(textIndent.substring(0, textIndent.indexOf("em")));
                                } else if (textIndent && textIndent.endsWith("px")) {
                                    const pxValue = Number(textIndent.substring(0, textIndent.indexOf("px")));
                                    emValue = pxValue / 16;
                                }

                                if (emValue > 0) {
                                    level = Math.round(emValue / 2);
                                }
                                if (level) {
                                    if (level > this.options.maxLevel) level = this.options.maxLevel;
                                    else if (level < this.options.minLevel) level = this.options.minLevel;
                                    return level;
                                } else {
                                    return 0
                                }
                            }
                        },

                        renderHTML: attributes => {
                            // return attributes?.indent > this.options.minLevel ? { 'data-indent': attributes.indent } : null;
                            if (!attributes.indent) {
                                return {}
                            }

                            return {
                                style: `text-indent: ${attributes?.indent * 2}em`,
                                "data-indent": attributes?.indent,
                            }
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        const setNodeIndentMarkup = (tr: Transaction, pos: number, delta: number): Transaction => {
            const node = tr?.doc?.nodeAt(pos);

            if (node) {
                const nextLevel = (node.attrs.indent || 0) + delta;
                const {minLevel, maxLevel} = this.options;
                const indent = nextLevel < minLevel ? minLevel : nextLevel > maxLevel ? maxLevel : nextLevel;

                if (indent !== node.attrs.indent) {
                    const {indent: oldIndent, ...currentAttrs} = node.attrs;
                    const nodeAttrs = indent > minLevel ? {...currentAttrs, indent} : currentAttrs;
                    return tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
                }
            }
            return tr;
        };

        const updateIndentLevel = (tr: Transaction, delta: number): Transaction => {
            const {doc, selection} = tr;

            if (doc && selection && (selection instanceof TextSelection || selection instanceof AllSelection)) {
                const {from, to} = selection;
                doc.nodesBetween(from, to, (node, pos) => {
                    if (this.options.types.includes(node.type.name)) {
                        tr = setNodeIndentMarkup(tr, pos, delta);
                        return false;
                    }

                    return true;
                });
            }

            return tr;
        };

        const applyIndent: (direction: number) => () => Command =
            direction =>
                () =>
                    ({tr, state, dispatch}) => {
                        const {selection} = state;
                        tr = tr.setSelection(selection);
                        tr = updateIndentLevel(tr, direction);

                        if (tr.docChanged) {
                            dispatch?.(tr);
                            return true;
                        }

                        return false;
                    };
        return {
            indent: applyIndent(1),
            outdent: applyIndent(-1),
        };
    },

    addKeyboardShortcuts() {
        return {
            Tab: () => {
                if (this.editor.isActive('listItem') ||
                    this.editor.isActive('orderedList')) {
                    return false;
                }
                return this.editor.commands.indent();
            },
            'Shift-Tab': () => {
                if (this.editor.isActive('listItem') ||
                    this.editor.isActive('orderedList')) {
                    return false;
                }
                return this.editor.commands.outdent();
            },
        };
    },
});
