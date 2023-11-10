import {AiEditorOptions, AiEditorEvent} from "../core/AiEditor.ts";
import {Editor, EditorEvents} from "@tiptap/core";
// @ts-ignore
import {ChainedCommands} from "@tiptap/core/dist/packages/core/src/types";

export class AbstractMenuButton extends HTMLElement implements AiEditorEvent {

    template: string = '';
    editor?: Editor;
    options?: AiEditorOptions;

    protected constructor() {
        super();
    }

    protected registerClickListener() {
        this.addEventListener("click", () => {
            const chain = this.editor?.chain();
            this.onClick(chain);
            chain?.run();
        })
    }

    connectedCallback() {
        this.innerHTML = this.template;
    }

    // @ts-ignore
    onClick(commands: ChainedCommands) {
        //do nothing
    }

    onCreate(props: EditorEvents["create"], options: AiEditorOptions): void {
        this.editor = props.editor;
        this.options = options;
    }

    onTransaction(event: EditorEvents["transaction"]): void {
        const htmlDivElement = this.querySelector("div");
        if (!htmlDivElement) return;
        if (this.onActive(event.editor)) {
            htmlDivElement.classList.add("active")
        } else {
            htmlDivElement.classList.remove("active")
        }
    }

    // @ts-ignore
    onActive(editor: Editor): boolean {
        return false
    }
}



