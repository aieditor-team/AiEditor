import {
    Heading, HeadingOptions
} from '@tiptap/extension-heading';

export const HeadingExt = Heading.extend<HeadingOptions>({

    addAttributes() {
        return {
            ...this.parent?.(),
            id: {
                default: null,
            }
        }
    },

})