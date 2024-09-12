import {Editor, EditorEvents} from "@tiptap/core";
import {AbstractDropdownMenuButton} from "../AbstractDropdownMenuButton.ts";
import {AiEditorOptions} from "../../core/AiEditor.ts";


const titles = ["1.0", "1.25", "1.5", "2.0", "2.5", "3.0"];

export class LineHeight extends AbstractDropdownMenuButton<string> {

    constructor() {
        super();
        this.refreshMenuText = false;
        this.dropDivWith = "70px"
        this.width = "36px"
        this.menuTextWidth = "20px"
    }

    onCreate(props: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(props, options);
        this.menuData = options.lineHeight?.values || titles;
    }

    onDropdownActive(editor: Editor, index: number): boolean {
        let lineHeight = null;
        if (editor.isActive("paragraph")) {
            const attrs = editor.getAttributes("paragraph")
            lineHeight = attrs.lineHeight;
        } else if (editor.isActive("heading")) {
            const attrs = editor.getAttributes("heading")
            lineHeight = attrs.lineHeight;
        }

        if (lineHeight && lineHeight === `${(Number(this.menuData[index]) * 100).toFixed(0)}%`) {
            return true;
        }

        return false
    }

    onDropdownItemClick(index: number): void {
        const lineHeight = `${(Number(this.menuData[index]) * 100).toFixed(0)}%`;
        this.editor!.chain().setLineHeight(lineHeight).run();
    }

    onDropdownItemRender(index: number): Element | string {
        return this.menuData[index];
    }

    onMenuTextRender(_: number): Element | string {
        return `
              <div style="width:18px;height: 18px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 4H21V6H11V4ZM6 7V11H4V7H1L5 3L9 7H6ZM6 17H9L5 21L1 17H4V13H6V17ZM11 18H21V20H11V18ZM9 11H21V13H9V11Z"></path></svg>
              </div>
         `;
    }
}


