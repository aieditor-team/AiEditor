import {AbstractBubbleMenu} from "../AbstractBubbleMenu.ts";
import {EditorEvents} from "@tiptap/core";
import {AiEditorOptions} from "../../core/AiEditor.ts";
import {AllSelectionMenuItems} from "./items/selection/AllSelectionMenuItems.ts";
import {removeIf} from "../../util/removeIf.ts";


export class TextSelectionBubbleMenu extends AbstractBubbleMenu {
    constructor() {
        super();
    }

    onCreate(props: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(props, options);
        if (options?.textSelectionBubbleMenu?.items && options?.textSelectionBubbleMenu?.items.length > 0) {
            for (let key of options.textSelectionBubbleMenu.items) {
                const linkMenuItem = AllSelectionMenuItems[key];
                if (linkMenuItem) this.items.push(linkMenuItem);
            }
        } else {
            this.items = [
                ...Object.values(AllSelectionMenuItems)
            ]
            if (options.ai?.bubblePanelEnable === false) {
                removeIf(this.items, (item) => item.id === "ai")
            }
        }
    }


}



