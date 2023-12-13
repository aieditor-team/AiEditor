import {AiEditorOptions, AiEditorEvent} from "../core/AiEditor.ts";
import {Editor, EditorEvents} from "@tiptap/core";
import tippy from "tippy.js";

export type BubbleMenuItem = {
    id: string,
    title?: string,
    content: string,
}

export abstract class AbstractBubbleMenu extends HTMLElement implements AiEditorEvent {

    editor?: Editor;
    items: BubbleMenuItem[] = [];

    protected constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="aie-bubble-menu">
               ${this.items!.map((item) => {
            return `<div class="aie-bubble-menu-item" id="${item.id}">${item.content}</div>`
        }).join('')}
            </div>
        `;

        this.querySelector("div")!.addEventListener("click", (e) => {
            this.items.forEach((item) => {
                const target = (e.target as any).closest(`#${item.id}`);
                if (target) this.onItemClick(item.id);
            })
        })

        this.querySelectorAll(".aie-bubble-menu-item").forEach((el, index) => {
            const title = this.items[index].title;
            if (title) {
                tippy(el, {
                    appendTo: this.closest(".aie-container")!,
                    content: title,
                    theme: 'aietip',
                    arrow: true,
                    // trigger:"click",
                    // interactive:true,
                });
            }
        });
    }

    onCreate(props: EditorEvents['create'], _: AiEditorOptions) {
        this.editor = props.editor
    }

    abstract onItemClick(id: string): void;

    abstract onTransaction(props: EditorEvents['transaction']): void

}



