import {AlignLeft} from "./AlignLeft.ts";
import {AlignCenter} from "./AlignCenter.ts";
import {AlignRight} from "./AlignRight.ts";
import {Delete} from "../commons/Delete.ts";
import {MenuRecord} from "../MenuRecord.ts";

export const AllImageMenuItems = new MenuRecord(
    [AlignLeft, AlignCenter, AlignRight, Delete]
)