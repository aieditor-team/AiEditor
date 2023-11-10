import {Extension} from "@tiptap/core";

export interface LineHeightOptions {
    types: string[];
    heights: string[];
    defaultHeight: string;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        lineHeight: {
            /**
             * Set the line height attribute
             */
            setLineHeight: (height: string) => ReturnType;
            /**
             * Unset the text align attribute
             */
            unsetLineHeight: () => ReturnType;
        };
    }
}

export const LineHeightExt = Extension.create<LineHeightOptions>({
    name: "lineHeight",

    addOptions() {
        return {
            types: ["heading", "paragraph"],
            heights: ["100%", "125%", "150%", "200%", "250%", "300%"],
            defaultHeight: "100%",
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: this.options.defaultHeight,
                        parseHTML: (element) =>
                            element.style.lineHeight || this.options.defaultHeight,
                        renderHTML: (attributes) => {
                            if (attributes.lineHeight === this.options.defaultHeight) {
                                return {};
                            }

                            return {style: `line-height: ${attributes.lineHeight}`};
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setLineHeight:
                (height: string) =>
                    ({commands}) => {
                        if (!this.options.heights.includes(height)) {
                            return false;
                        }

                        return this.options.types.every((type) =>
                            commands.updateAttributes(type, {lineHeight: height})
                        );
                    },

            unsetLineHeight:
                () =>
                    ({commands}) => {
                        return this.options.types.every((type) =>
                            commands.resetAttributes(type, "lineHeight")
                        );
                    },
        };
    },
});