import '@tiptap/extension-text-style'

import {Extension} from '@tiptap/core'

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
                        parseHTML: element => element.getAttribute('class'),
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
})
