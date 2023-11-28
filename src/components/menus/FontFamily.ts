import {AbstractDropdownMenuButton} from "../AbstractDropdownMenuButton.ts";
import {Editor, EditorEvents} from "@tiptap/core";
import {AiEditorOptions, NameAndValue} from "../../core/AiEditor.ts";
import {t} from "i18next";


const fontFamilies: NameAndValue[] = [
    {name: "宋体", value: "SimSun"},
    {name: "仿宋", value: "FangSong"},
    {name: "黑体", value: "SimHei"},
    {name: "楷体", value: "KaiTi"},
    {name: "微软雅黑", value: "Microsoft YaHei"},
    {name: "方正仿宋简体_GBK", value: "FangSong_GB2312"},
    {name: "Arial", value: "Arial"},
]

export class FontFamily extends AbstractDropdownMenuButton<NameAndValue> {
    constructor() {
        super();
        this.width = "72px"
        this.menuTextWidth = "60px"
        this.dropDivWith = "150px"
    }

    onCreate(_: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(_, options);
        this.menuData = options.fontFamily?.values || fontFamilies;
        this.menuData = [
            {name: t("default-font-family"), value: ""}
        ].concat(this.menuData);
    }

    onDropdownActive(editor: Editor, index: number): boolean {
        return editor.isActive('textStyle', {fontFamily: this.menuData[index].value});
    }

    onDropdownItemClick(index: number): void {
        const value = this.menuData[index].value;
        if (value) {
            this.editor!.chain()
                .setFontFamily(value)
                .run()
        } else {
            this.editor!.chain()
                .unsetFontFamily()
                .run()
        }

    }

    onDropdownItemRender(index: number): Element | string {
        return this.menuData[index].name;
    }

    onMenuTextRender(index: number): Element | string {
        return this.menuData[index].name;
    }


}


