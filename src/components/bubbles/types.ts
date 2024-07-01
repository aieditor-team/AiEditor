import {AiEditor} from "../../core/AiEditor.ts";
import {Instance} from "tippy.js";

export type BubbleMenuItem = {
    id: string,
    title?: string,
    icon: string,
    holder?: any,
    onInit?: (editor: AiEditor, tippyInstance: Instance, parentEle: HTMLElement) => any;
    onClick?: (editor: AiEditor, tippyInstance: Instance, parentEle: HTMLElement, holder: any) => void;
}