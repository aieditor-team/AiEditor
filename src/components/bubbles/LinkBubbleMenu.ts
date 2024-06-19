import {AbstractBubbleMenu} from "../AbstractBubbleMenu.ts";
import {EditorEvents} from "@tiptap/core";
import {AiEditorOptions} from "../../core/AiEditor.ts";
import {AllLinkMenuItems} from "./items/link/AllLinkMenuItems.ts";


export class LinkBubbleMenu extends AbstractBubbleMenu {

    constructor() {
        super();
    }

    onCreate(props: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(props, options);
        if (options?.link?.bubbleMenuItems && options?.link?.bubbleMenuItems.length > 0) {
            for (let key of options.link.bubbleMenuItems) {
                const linkMenuItem = AllLinkMenuItems[key];
                if (linkMenuItem) this.items.push(linkMenuItem);
            }
        } else {
            this.items = [
                ...Object.values(AllLinkMenuItems)
            ]
        }
    }

}



