import {Edit} from "./Edit.ts";
import {UnLink} from "./UnLink.ts";
import {Visit} from "./Visit.ts";
import {MenuRecord} from "../MenuRecord.ts";

export const AllLinkMenuItems = new MenuRecord(
    [Edit, UnLink, Visit]
)

