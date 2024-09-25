import {AbstractBubbleMenu} from "../AbstractBubbleMenu.ts";
import {EditorEvents} from "@tiptap/core";
import {AiEditorOptions} from "../../core/AiEditor.ts";
import {AllSelectionMenuItems} from "./items/selection/AllSelectionMenuItems.ts";
import {BubbleMenuItem} from "./types.ts";
import {removeIf} from "../../util/removeIf.ts";


export class TextSelectionBubbleMenu extends AbstractBubbleMenu {
    constructor() {
        super();
    }

    onCreate(event: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(event, options);
        this.initItemsByOptions(AllSelectionMenuItems, options?.textSelectionBubbleMenu?.items);

        if (options.ai?.bubblePanelEnable === false) {
            removeIf(this.items, (item: BubbleMenuItem) => item.id === "ai")
        } else if (options.ai?.bubblePanelIcon) {
            for (let item of this.items) {
                if (item.id === "ai") {
                    item.icon = options.ai?.bubblePanelIcon;
                    break
                }
            }
        }
    }

}