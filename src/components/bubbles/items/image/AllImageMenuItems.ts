import {AlignLeft} from "./AlignLeft.ts";
import {AlignCenter} from "./AlignCenter.ts";
import {AlignRight} from "./AlignRight.ts";
import {Delete} from "../commons/Delete.ts";
import {MenuRecord} from "../MenuRecord.ts";
import {ImageLink} from "./ImageLink.ts";
import {ImageProperty} from "./ImageProperty.ts";

export const AllImageMenuItems = new MenuRecord(
    [AlignLeft, AlignCenter, AlignRight, ImageLink, ImageProperty, Delete]
)
