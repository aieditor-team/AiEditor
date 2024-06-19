import {BubbleMenuItem} from "../../types.ts";
import {AI} from "./AI.ts";
import {Bold} from "./Bold.ts";
import {Underline} from "./Underline.ts";
import {Code} from "./Code.ts";
import {Strike} from "./Strike.ts";
import {Italic} from "./Italic.ts";

const push = (r: Record<string, any>, name: string, value: any) => {
    r[name] = value;
}
export const AllSelectionMenuItems = {} as Record<string, BubbleMenuItem>

push(AllSelectionMenuItems, AI.id, AI)
push(AllSelectionMenuItems, Bold.id, Bold)
push(AllSelectionMenuItems, Italic.id, Italic)
push(AllSelectionMenuItems, Underline.id, Underline)
push(AllSelectionMenuItems, Strike.id, Strike)
push(AllSelectionMenuItems, Code.id, Code)
