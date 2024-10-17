import '@tiptap/extension-text-style'

import {Extension} from '@tiptap/core'
import {ReplaceStep} from "prosemirror-transform";

export type ClassNameOptions = {
    types: string[],
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        className: {
            setClassName: (nodeType: string, className: string) => ReturnType,
        }
    }
}

export const ClassNameExt = Extension.create<ClassNameOptions>({
    name: 'className',

    addOptions() {
        return {
            types: ['heading', 'paragraph', 'container', 'codeBlock', 'blockquote', 'bulletList', 'orderedList', 'listItem',
                'taskList', 'taskItem',
                'image', 'video', 'table', 'iframe'],
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    "class": {
                        defaultValue: "",
                        parseHTML: element => {
                            return element.getAttribute('class');
                        },
                        renderHTML: (attributes) => {
                            if (!attributes['class']) {
                                return {};
                            }
                            return {
                                'class': attributes['class'],
                            }
                        }
                    }
                },
            },
        ]
    },

    addCommands() {
        return {
            setClassName: (nodeType, className) => ({chain}) => {
                if (!nodeType || !this.options.types.includes(nodeType)) return false;
                return chain()
                    .updateAttributes(nodeType, {'class': className})
                    .run()
            },
        }
    },

    onTransaction({editor, transaction}) {
        if (transaction.steps.length > 0) {
            transaction.steps.forEach((step) => {
                if (step instanceof ReplaceStep) {
                    let isNewParagraphByInputEnterKey = false;
                    step.getMap().forEach((_oldStart: number, _oldEnd: number, newStart: number, newEnd: number) => {
                        if (newEnd == newStart + 2) {
                            isNewParagraphByInputEnterKey = true;
                        }
                    })
                    if (isNewParagraphByInputEnterKey) {
                        const rStep = step as ReplaceStep;
                        const paragraph = rStep.slice.content.lastChild;
                        if (paragraph && !paragraph.textContent) {
                            //remove className
                            editor.commands.updateAttributes(paragraph.type, {...paragraph.attrs, 'class': ''});
                        }
                    }
                }
            })
        }
    },

})
