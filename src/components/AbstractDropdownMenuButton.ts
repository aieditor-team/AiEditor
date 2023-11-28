import {AbstractMenuButton} from "./AbstractMenuButton.ts";
import tippy, {Instance} from "tippy.js";
import {Editor, EditorEvents} from "@tiptap/core";

export abstract class AbstractDropdownMenuButton<T> extends AbstractMenuButton {
    tippyInstance?: Instance;
    tippyEl?: HTMLDivElement;
    textEl?: HTMLDivElement;
    menuData: T[] = [];
    menuTextWidth: string = "40px";
    defaultMenuIndex: number = 0;
    refreshMenuText: boolean = true;
    width: string = "48px";
    dropDivWith: string = "100px";
    dropDivHeight: string = "260px";
    showItemsTip: boolean = false;

    renderTemplate() {
        this.template = `
         <div style="width: ${this.width};">
         <div style="display: flex" id="tippy">
             <span style="line-height: 18px;font-size: 14px;text-align:center;overflow: hidden; width: ${this.menuTextWidth}" id="text">
                ${this.onMenuTextRender(this.defaultMenuIndex)}
             </span>
             <div style="width: 18px;height: 18px;display: inline-block">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 14L8 10H16L12 14Z"></path></svg>
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
            <div class="red-dot-container" id="item${i}"><div class="${i == 0 ? "red-dot" : ""}"></div></div>
            <div class="text">${this.onDropdownItemRender(i)}</div>
            `
            item.addEventListener("click", () => {
                this.onDropdownItemClick(i);
                this.tippyInstance!.hide()
            });

            if (this.showItemsTip) {
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
            if (typeof menuTextResult === "string" || typeof menuTextResult === "number") {
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


