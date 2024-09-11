import {AbstractBubbleMenu} from "../AbstractBubbleMenu.ts";
import {EditorEvents} from "@tiptap/core";
import {AiEditorOptions} from "../../core/AiEditor.ts";
import {AllImageMenuItems} from "./items/image/AllImageMenuItems.ts";

export class ImageBubbleMenu extends AbstractBubbleMenu {
    constructor() {
        super();
    }

    onCreate(event: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(event, options);
        this.initItemsByOptions(AllImageMenuItems, options?.image?.bubbleMenuItems);
        this.activeOnClick = false;
    }

}



