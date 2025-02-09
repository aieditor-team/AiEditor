import {
    Heading, HeadingOptions
} from '@tiptap/extension-heading';
import {uuid} from "../util/uuid.ts";

export const HeadingExt = Heading.extend<HeadingOptions>({

    addAttributes() {
        return {
            ...this.parent?.(),
            id: {
                default: null,
                parseHTML: element => element.id || uuid(),
            }
        }
    },

})