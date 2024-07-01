import {AiEditorOptions, AiEditorEvent, InnerEditor} from "../core/AiEditor.ts";
import {Editor, EditorEvents} from "@tiptap/core";
import tippy, {Instance} from "tippy.js";
import {BubbleMenuItem} from "./bubbles/types.ts";
import {MenuRecord} from "./bubbles/items/MenuRecord.ts";
import {t} from "i18next";


export abstract class AbstractBubbleMenu extends HTMLElement implements AiEditorEvent {

    editor?: Editor;
    items: BubbleMenuItem[] = [];
    tippyInstance?: Instance;

    protected constructor() {
        super();
    }

    isActive(id: string) {
        return this.editor?.isActive(id);
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="aie-bubble-menu">
               ${this.items!.map((item) => {
            return `<div class="aie-bubble-menu-item ${this.isActive(item.id) ? 'active' : ''}" id="${item.id}">${item.content}</div>`
        }).join('')}
            </div>
        `;

        for (let item of this.items) {
            item.holder = item.onInit?.(this.editor as InnerEditor, this.tippyInstance!, this);
        }

        this.querySelector("div")!.addEventListener("click", (e) => {
            this.items.forEach((item) => {
                const target = (e.target as any).closest(`#${item.id}`);
                if (target) {
                    target.classList.contains("active") ? target.classList.remove("active") : target.classList.add("active")
                    this.onItemClick(item);
                }
            })
        })

        this.querySelectorAll(".aie-bubble-menu-item").forEach((el, index) => {
            const title = this.items[index].title;
            if (title) {
                tippy(el, {
                    appendTo: this.closest(".aie-container")!,
                    content: t(title),
                    theme: 'aietip',
                    arrow: true,
                    // trigger:"click",
                    // interactive:true,
                });
            }
        });
    }

    set instance(value: Instance) {
        this.tippyInstance = value;
    }

    protected initItemsByOptions(allMenuItems: MenuRecord, optionItems?: (string | BubbleMenuItem)[]) {
        if (optionItems && optionItems.length > 0) {
            for (let key of optionItems) {
                const linkMenuItem = typeof key === "string" ? allMenuItems.getItem(key) : key;
                if (linkMenuItem) this.items.push(linkMenuItem);
            }
        } else {
            this.items = allMenuItems.getAllItem()
        }
    }

    onCreate(createEvent: EditorEvents['create'], _: AiEditorOptions) {
        this.editor = createEvent.editor
    }

    onItemClick(item: BubbleMenuItem) {
        item.onClick?.(this.editor as InnerEditor, this.tippyInstance!, this, item.holder);
    }

    onTransaction(_transEvent: EditorEvents['transaction']) {
    }

}



