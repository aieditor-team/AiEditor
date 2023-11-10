import {Editor, EditorEvents} from "@tiptap/core";
import {AbstractDropdownMenuButton} from "../AbstractDropdownMenuButton.ts";
import {AiEditorOptions, NameAndValue} from "../../core/AiEditor.ts";


const fontSizes: NameAndValue[] = [
    {name: "初号", value: 56},
    {name: "小初", value: 48},
    {name: "一号", value: 34.7},
    {name: "小一", value: 32},
    {name: "二号", value: 29.3},
    {name: "小二", value: 24},
    {name: "三号", value: 21.3},
    {name: "小三", value: 20},
    {name: "四号", value: 18.7},
    {name: "小四", value: 16},
    {name: "五号", value: 14},
    {name: "小五", value: 12},
    {name: "9", value: 9},
    {name: "10", value: 10},
    {name: "11", value: 11},
    {name: "12", value: 12},
    {name: "14", value: 14},
    {name: "18", value: 18},
    {name: "20", value: 20},
    {name: "22", value: 22},
    {name: "24", value: 24},
    {name: "26", value: 26},
    {name: "28", value: 28},
    {name: "30", value: 30},
    {name: "36", value: 36},
    {name: "42", value: 42},
    {name: "48", value: 48},
    {name: "56", value: 56},
    {name: "72", value: 72},
]

export class FontSize extends AbstractDropdownMenuButton<NameAndValue> {

    constructor() {
        super();
    }

    onCreate(_: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(_, options);
        this.menuData = options.fontSize?.values || fontSizes;
    }

    onDropdownActive(editor: Editor, index: number): boolean {
        return editor.isActive('textStyle', {fontSize: `${this.menuData[index].value}px`});
    }

    onDropdownItemClick(index: number): void {
        this.editor?.chain().focus()
            .setFontSize(`${this.menuData[index].value}px`)
            .run()
    }

    onDropdownItemRender(index: number): Element | string {
        return this.menuData[index].name;
    }

    onMenuTextRender(index: number): Element | string {
        return this.menuData[index].name;
    }


}


