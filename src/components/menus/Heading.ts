import {Editor} from "@tiptap/core";
import {AbstractDropdownMenuButton} from "../AbstractDropdownMenuButton.ts";
import {t} from "i18next";

const titles = ["paragraph", "h1", "h2", "h3", "h4", "h5", "h6"];

export class Heading extends AbstractDropdownMenuButton<string> {

    constructor() {
        super();
        this.menuData = titles.map((v) => t(v));
        this.dropDivHeight = "265px";
        this.dropDivWith = "150px";

    }

    onDropdownActive(editor: Editor, index: number): boolean {
        if (index == 0) {
            return editor.isActive("paragraph")
        }
        return editor.isActive("heading", {level: index});
    }

    onDropdownItemClick(index: number): void {
        if (index == 0) {
            this.editor!.chain().setParagraph().run()
        } else {
            this.editor!.chain().setHeading({level: index as any}).run();
        }
    }

    onDropdownItemRender(index: number): Element | string {
        if (index == 0) return this.menuData[index];
        return `<h${index}>${this.menuData[index]}</h${index}>`;
    }

    onMenuTextRender(index: number): Element | string {
        return this.menuData[index].replace(" ","");
    }

}



