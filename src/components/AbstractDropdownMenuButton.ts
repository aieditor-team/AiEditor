import {AbstractMenuButton} from "./AbstractMenuButton.ts";
import tippy, {Instance} from "tippy.js";
import {Editor, EditorEvents} from "@tiptap/core";
import {AiEditorOptions} from "../core/AiEditor.ts";

export abstract class AbstractDropdownMenuButton<T> extends AbstractMenuButton {
    tippyInstance?: Instance;
    tippyEl?: HTMLDivElement;
    textEl?: HTMLDivElement;
    menuData: T[] = [];
    menuTextWidth: string = "fit-content";
    defaultMenuIndex: number = 0;
    refreshMenuText: boolean = true;
    width: string = "fit-content";
    dropDivWith: string = "fit-content";
    dropDivHeight: string = "fit-content";
    showItemsTip: boolean = false;

    renderTemplate() {
        this.template = `
         <div>
         <div style="display: flex;align-items: center;padding: 0 4px;" id="tippy">
             <span style="display:flex;text-align:center;overflow: hidden;" id="text">
                ${this.onMenuTextRender(this.defaultMenuIndex)}
             </span>
             <div style="display: flex;justify-content: center;align-items: center;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="none" d="M0 0h24v24H0z"></path><path d="M12 14L8 10H16L12 14Z"></path>
                </svg>
             </div>
         </div>
         </div>
        `
    }

    connectedCallback() {
        this.renderTemplate();
        super.connectedCallback();

        this.textEl = this.querySelector("#text") as HTMLDivElement;
        this.tippyInstance = tippy(this.querySelector("#tippy")!, {
            content: this.createMenuElement(),
            appendTo: this.closest(".aie-container")!,
            placement: 'bottom',
            trigger: 'click',
            interactive: true,
            arrow: false,
        })
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
            <div class="red-dot-container" id="item${i}">
                <div class="${i == this.defaultMenuIndex ? "red-dot" : ""}"></div>
            </div>
            <div class="text">${this.onDropdownItemRender(i)}</div>
            `
            item.addEventListener("click", (event) => {
                const menuItem = this.menuData[i] as any;
                if (menuItem.onClick) {
                    const result = menuItem.onClick(event, this.editor!.aiEditor)
                    if (result) this.tippyInstance!.hide()
                } else {
                    this.onDropdownItemClick(i);
                    this.tippyInstance!.hide()
                }
            });

            if (this.showItemsTip && (this.editor?.options as AiEditorOptions).toolbarTipEnable !== false) {
                const itemData = this.menuData[i] as any;
                tippy(item, {
                    appendTo: () => this.closest(".aie-container")!,
                    content: itemData.tip || itemData.title,
                    theme: 'aietip',
                    arrow: true,
                    placement: "right"
                });
            }

            div.appendChild(item)
        }
        this.tippyEl = div;
        return div;
    }


    onTransaction(event: EditorEvents["transaction"]) {
        const redDot = this.tippyEl?.querySelector(".red-dot");
        if (redDot) {
            redDot.classList.remove("red-dot")
        }

        let activeIndex = this.defaultMenuIndex;
        for (let index = 0; index < this.menuData.length; index++) {
            if (this.onDropdownActive(event.editor, index)) {
                activeIndex = index;
                break;
            }
        }

        this.tippyEl?.querySelector(`#item${activeIndex}`)!.children[0].classList.add("red-dot")
        if (this.refreshMenuText && this.textEl) {
            const menuTextResult = this.onMenuTextRender(activeIndex);
            if (typeof menuTextResult === "string") {
                this.textEl.innerHTML = menuTextResult;
            } else {
                this.textEl.removeChild(this.textEl.firstChild!);
                this.textEl.appendChild(menuTextResult as Node);
            }
        }
    }

    abstract onDropdownActive(editor: Editor, index: number): boolean;

    abstract onMenuTextRender(index: number): Element | string;

    abstract onDropdownItemRender(index: number): Element | string;

    abstract onDropdownItemClick(index: number): void;

}
