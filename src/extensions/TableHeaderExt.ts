import {TableHeader} from '@tiptap/extension-table-header';

export const TableHeaderExt = TableHeader.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            backgroundColor: {
                default: null,
                parseHTML: (element) => element.style.backgroundColor || null,
                renderHTML: (attributes) => {
                    if (!attributes.backgroundColor) {
                        return {};
                    }
                    return {
                        style: `background-color: ${attributes.backgroundColor}`,
                    };
                },
            },

            color: {
                default: null,
                parseHTML: (element) => element.style.color || null,
                renderHTML: (attributes) => {
                    if (!attributes.color) {
                        return {};
                    }
                    return {
                        style: `color: ${attributes.color}`,
                    };
                },
            },

            width: {
                default: null,
                parseHTML: (element) => element.style.width || null,
                renderHTML: (attributes) => {
                    if (!attributes.width) {
                        return {};
                    }
                    return {
                        style: `width: ${attributes.width}`,
                    };
                },
            },
        };
    },
});
