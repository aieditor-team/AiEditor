import {AbstractDropdownMenuButton} from "../AbstractDropdownMenuButton.ts";
import {Editor} from "@tiptap/core";
import {t} from "i18next";

type AlignInfo = {
    icon: string,
    title: string,
    value: string,
}

const alignInfos: AlignInfo[] = [
    {
        icon: `<div style="width:18px;height: 18px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 4H21V6H3V4ZM3 19H17V21H3V19ZM3 14H21V16H3V14ZM3 9H17V11H3V9Z"></path></svg></div>`,
        title: "align-left",
        value: "left"
    },
    {
        icon: `<div style="width:18px;height: 18px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 4H21V6H3V4ZM5 19H19V21H5V19ZM3 14H21V16H3V14ZM5 9H19V11H5V9Z"></path></svg></div>`,
        title: "align-center",
        value: "center"
    },
    {
        icon: `<div style="width:18px;height: 18px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 4H21V6H3V4ZM7 19H21V21H7V19ZM3 14H21V16H3V14ZM7 9H21V11H7V9Z"></path></svg></div>`,
        title: "align-right",
        value: "right"
    },
    {
        icon: `<div style="width:18px;height: 18px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 4H21V6H3V4ZM3 19H21V21H3V19ZM3 14H21V16H3V14ZM3 9H21V11H3V9Z"></path></svg></div>`,
        title: "align-justify",
        value: "justify"
    },
]

export class Align extends AbstractDropdownMenuButton<AlignInfo> {

    constructor() {
        super();
        this.menuData = alignInfos.map((v) => {
            return {...v, title: t(v.title)}
        });
        this.dropDivHeight = "112px"
        this.dropDivWith = "60px"
        this.width = "36px"
        this.menuTextWidth = "20px"
        this.showItemsTip = true;
    }

    onDropdownActive(editor: Editor, index: number): boolean {
        return editor.isActive({textAlign: this.menuData[index].value});
    }

    onDropdownItemClick(index: number): void {
        this.editor!.chain().focus()
            .setTextAlign(this.menuData[index].value)
            .run()
    }

    onDropdownItemRender(index: number): Element | string {
        return this.menuData[index].icon;
    }

    onMenuTextRender(index: number): Element | string {
        return this.menuData[index].icon;
    }

}

