import {Edit} from "./Edit.ts";
import {UnLink} from "./UnLink.ts";
import {Visit} from "./Visit.ts";
import {BubbleMenuItem} from "../../types.ts";

const push = (r: Record<string, any>, name: string, value: any) => {
    r[name] = value;
}
export const AllLinkMenuItems = {} as Record<string, BubbleMenuItem>

push(AllLinkMenuItems, Edit.id, Edit)
push(AllLinkMenuItems, UnLink.id, UnLink)
push(AllLinkMenuItems, Visit.id, Visit)
