import {AlignLeft} from "./AlignLeft.ts";
import {AlignCenter} from "./AlignCenter.ts";
import {AlignRight} from "./AlignRight.ts";
import {Resize} from "./Resize.ts";
import {Delete} from "../commons/Delete.ts";
import {MenuRecord} from "../MenuRecord.ts";
import {ImageLink} from "./ImageLink.ts";

export const AllImageMenuItems = new MenuRecord(
    [AlignLeft, AlignCenter, AlignRight, Resize, ImageLink, Delete]
)
