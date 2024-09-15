import {BubbleMenuItem} from "../../types.ts";

export const Resize = {
    id: "Resize",
    title: "resize",
    icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M3 21C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3ZM15 10H4V19H15V10ZM20 10H17V19H20V10ZM20 5H4V8H20V5Z\"></path></svg>",
    onClick: ({innerEditor}) => {
        const attrs = innerEditor.getAttributes("image")!;
        const {width} = attrs;
        if (width === "100%") {
            attrs.width = "50%";
        } else if (width === "50%") {
            attrs.width = "75%";
        } else {
            attrs.width = "100%";
        }
        innerEditor.chain().setImage(attrs as any).run();
    }
} as BubbleMenuItem;