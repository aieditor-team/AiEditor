import {AbstractDropdownMenuButton} from "../AbstractDropdownMenuButton.ts";
import {Editor, EditorEvents} from "@tiptap/core";
import {AiEditorOptions} from "../../core/AiEditor.ts";
import {AiModelManager} from "../../ai/AiModelManager.ts";
import {AiMenu} from "../../ai/AiGlobalConfig.ts";
import {DefaultAiMessageListener} from "../../ai/core/DefaultAiMessageListener.ts";


const aiMenus: AiMenu[] = [
    {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M4 18.9997H20V13.9997H22V19.9997C22 20.552 21.5523 20.9997 21 20.9997H3C2.44772 20.9997 2 20.552 2 19.9997V13.9997H4V18.9997ZM16.1716 6.9997L12.2218 3.04996L13.636 1.63574L20 7.9997L13.636 14.3637L12.2218 12.9495L16.1716 8.9997H5V6.9997H16.1716Z"></path></svg>`,
        name: "AI 续写",
        prompt: "请帮我继续扩展一些这段话的内容",
        text: "focusBefore",
        model: "auto",
    },
    {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15 5.25C16.7949 5.25 18.25 3.79493 18.25 2H19.75C19.75 3.79493 21.2051 5.25 23 5.25V6.75C21.2051 6.75 19.75 8.20507 19.75 10H18.25C18.25 8.20507 16.7949 6.75 15 6.75V5.25ZM4 7C4 5.89543 4.89543 5 6 5H13V3H6C3.79086 3 2 4.79086 2 7V17C2 19.2091 3.79086 21 6 21H18C20.2091 21 22 19.2091 22 17V12H20V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z"></path></svg>`,
        name: "AI 优化",
        prompt: "请帮我优化一下这段文字的内容，并返回结果",
        text: "selected",
        model: "auto",
    },
    {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M17.934 3.0359L19.666 4.0359L18.531 6H21V8H19V12H21V14H19V21H17V14L13.9157 14.0004C13.5914 16.8623 12.3522 19.3936 10.5466 21.1933L8.98361 19.9233C10.5031 18.4847 11.5801 16.4008 11.9008 14.0009L10 14V12L12 11.999V8H10V6H12.467L11.334 4.0359L13.066 3.0359L14.777 6H16.221L17.934 3.0359ZM5 13.803L3 14.339V12.268L5 11.732V8H3V6H5V3H7V6H9V8H7V11.197L9 10.661V12.731L7 13.267V18.5C7 19.8807 5.88071 21 4.5 21H3V19H4.5C4.74546 19 4.94961 18.8231 4.99194 18.5899L5 18.5V13.803ZM17 8H14V12H17V8Z"></path></svg>`,
        name: "AI 校对",
        prompt: "请帮我找出这段话的错别字，把错别字修改后，并返回结果，不要解释或其他多余的内容",
        text: "selected",
        model: "auto",
    },
    {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M5 15V17C5 18.0544 5.81588 18.9182 6.85074 18.9945L7 19H10V21H7C4.79086 21 3 19.2091 3 17V15H5ZM18 10L22.4 21H20.245L19.044 18H14.954L13.755 21H11.601L16 10H18ZM17 12.8852L15.753 16H18.245L17 12.8852ZM8 2V4H12V11H8V14H6V11H2V4H6V2H8ZM17 3C19.2091 3 21 4.79086 21 7V9H19V7C19 5.89543 18.1046 5 17 5H14V3H17ZM6 6H4V9H6V6ZM10 6H8V9H10V6Z"></path></svg>`,
        name: "AI 翻译",
        prompt: "请帮我翻译以上内容，在翻译之前，想先判断一下这个内容是不是中文，如果是中文，则翻译问英文，如果是其他语言，则需要翻译为中文，注意，你只需要返回翻译的结果，不需要对此进行任何解释，不需要除了翻译结果以外的其他任何内容。",
        text: "selected",
        model: "auto",
    }
]

export class Ai extends AbstractDropdownMenuButton<AiMenu> {

    constructor() {
        super();
        this.dropDivHeight = "auto"
        this.dropDivWith = "94px"
        this.width = "36px"
        this.menuTextWidth = "20px"
    }

    onCreate(_: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(_, options);
        this.menuData = options.ai?.menus || aiMenus;
    }


    renderTemplate() {
        this.template = `
         <div style="width: ${this.width};">
         <div id="tippy" class="menu-ai" id="text">
             <span> AI </span>
             <div style="width: 18px;height: 18px;display: inline-block" >
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 14L8 10H16L12 14Z"></path></svg>
             </div>
         </div>
         </div>
        `
    }


    createMenuElement() {
        const div = document.createElement("div");
        div.style.height = this.dropDivHeight;
        div.style.width = this.dropDivWith;
        div.classList.add("aie-dropdown-container");

        for (let i = 0; i < this.menuData.length; i++) {
            const item = document.createElement("div");
            item.classList.add("aie-dropdown-item");
            item.innerHTML = `
            <div class="text" style="display: flex;padding-left: 5px">${this.onDropdownItemRender(i)}</div>
            `
            item.addEventListener("click", () => {
                this.onDropdownItemClick(i);
                this.tippyInstance!.hide()
            });
            div.appendChild(item)
        }
        this.tippyEl = div;
        return div;
    }

    onTransaction(_: EditorEvents["transaction"]) {
        //do nothing
    }

    onDropdownActive(_editor: Editor, _index: number): boolean {
        return false;
    }

    getSelectedText(text: "selected" | "focusBefore") {
        if (text === "selected") {
            const {selection, doc} = this.editor!.state
            return doc.textBetween(selection.from, selection.to);
        } else {
            return this.editor!.state.selection.$head.parent.textContent;
        }
    }

    onDropdownItemClick(index: number): void {
        const aiMenu = this.menuData[index];
        const selectedText = this.getSelectedText(aiMenu.text!);

        if (selectedText) {
            const aiModel = AiModelManager.get(aiMenu.model!);
            if (aiModel) {
                aiModel?.chat(selectedText, aiMenu.prompt!, new DefaultAiMessageListener(this.editor!));
            } else {
                console.error("Ai model config error.")
            }

        } else {
            console.error("Can not get selected text.")
        }
    }


    onDropdownItemRender(index: number): Element | string {
        return `<div style="width:18px;height: 18px;">${this.menuData[index].icon}</div><div style="margin-left: 10px">${this.menuData[index].name}</div>`;
    }

    onMenuTextRender(index: number): Element | string {
        return this.menuData[index].icon;
    }

}

