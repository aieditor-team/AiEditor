import {AiEditorOptions, AiEditorEvent} from "../core/AiEditor.ts";
import {Editor, EditorEvents} from "@tiptap/core";

export type BubbleMenuItem = {
    id: string,
    svg: string,
}

export abstract class AbstractBubbleMenu extends HTMLElement implements AiEditorEvent{

    editor?: Editor;
    items: BubbleMenuItem[] = [];

    protected constructor() {
        super();
    }


    connectedCallback() {
        this.innerHTML = `
            <div class="aie-bubble-menu">
               ${this.items!.map((item) => {
                    return `
                   <div class="aie-bubble-menu-item" id="${item.id}">${item.svg}</div>
                   `
                }).join('')}
            </div>
        `;

        this.querySelector("div")!.addEventListener("click", (e) => {
            this.items.forEach((item) => {
                const target = (e.target as any).closest(`#${item.id}`);
                if (target) this.onItemClick(item.id);
            })
        })
    }

    onCreate(props: EditorEvents['create'], _: AiEditorOptions){
        this.editor = props.editor
    }

    abstract onItemClick(id: string): void;

    abstract onTransaction(props: EditorEvents['transaction']):void

}



