import {InnerEditor} from "../../core/AiEditor.ts";
import {Instance} from "tippy.js";

export type BubbleMenuItem = {
    id: string,
    title?: string,
    content: string,
    holder?: any,
    onInit?: (editor: InnerEditor, tippyInstance: Instance, parentEle: HTMLElement) => any;
    onClick?: (editor: InnerEditor, tippyInstance: Instance, parentEle: HTMLElement, holder: any) => void;
}