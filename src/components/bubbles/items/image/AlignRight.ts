import {BubbleMenuItem} from "../../types.ts";

export const AlignRight = {
    id: "AlignRight",
    title: "align-right",
    content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M3 4H21V6H3V4ZM7 19H21V21H7V19ZM3 14H21V16H3V14ZM7 9H21V11H7V9Z\"></path></svg>",
    onClick: (editor) => {
        const attrs = editor?.getAttributes("image")!;
        attrs.align = "right";
        editor?.chain().setImage(attrs as any).run();
    }
} as BubbleMenuItem;