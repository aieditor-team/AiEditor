import {AbstractBubbleMenu} from "../AbstractBubbleMenu.ts";
import {EditorEvents} from "@tiptap/core";
import {t} from "i18next";

export class ImageBubbleMenu extends AbstractBubbleMenu {
    constructor() {
        super();
        this.items = [
            {
                id: "left",
                title: t("align-left"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M3 4H21V6H3V4ZM3 19H17V21H3V19ZM3 14H21V16H3V14ZM3 9H17V11H3V9Z\"></path></svg>",
            },
            {
                id: "center",
                title: t("align-center"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M3 4H21V6H3V4ZM5 19H19V21H5V19ZM3 14H21V16H3V14ZM5 9H19V11H5V9Z\"></path></svg>",
            },
            {
                id: "right",
                title: t("align-right"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M3 4H21V6H3V4ZM7 19H21V21H7V19ZM3 14H21V16H3V14ZM7 9H21V11H7V9Z\"></path></svg>"
            },
            {
                id: "delete",
                title: t("delete"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z\"></path></svg>"
            }
        ]
    }


    onItemClick(id: string): void {
        if (id != "delete") {
            const attrs = this.editor?.getAttributes("image")!;
            attrs.align = id;
            this.editor?.chain().setImage(attrs as any).run();
        } else {
            this.editor?.commands.deleteSelection();
        }

    }

    onTransaction(_: EditorEvents["transaction"]): void {
    }

}



