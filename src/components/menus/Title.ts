import {Editor} from "@tiptap/core";
import {AbstractDropdownMenuButton} from "../AbstractDropdownMenuButton.ts";

const titles = ["正文", "标题 1", "标题 2", "标题 3", "标题 4", "标题 5", "标题 6"];
export class Title extends AbstractDropdownMenuButton<string> {

    constructor() {
        super();
        this.menuData = titles;
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
        return this.menuData[index];
    }

}



