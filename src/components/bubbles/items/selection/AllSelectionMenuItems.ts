import {AI} from "./AI.ts";
import {Bold} from "./Bold.ts";
import {Underline} from "./Underline.ts";
import {Code} from "./Code.ts";
import {Strike} from "./Strike.ts";
import {Italic} from "./Italic.ts";
import {MenuRecord} from "../MenuRecord.ts";

export const AllSelectionMenuItems = new MenuRecord(
    [AI, Bold, Italic, Underline, Strike, Code]
)

