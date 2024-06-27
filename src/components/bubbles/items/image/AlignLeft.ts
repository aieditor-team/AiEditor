import {BubbleMenuItem} from "../../types.ts";

export const AlignLeft = {
    id: "AlignLeft",
    title: "align-left",
    content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M3 4H21V6H3V4ZM3 19H17V21H3V19ZM3 14H21V16H3V14ZM3 9H17V11H3V9Z\"></path></svg>",
    onClick: (editor) => {
        const attrs = editor?.getAttributes("image")!;
        attrs.align = "left";
        editor?.chain().setImage(attrs as any).run();
    }
} as BubbleMenuItem;