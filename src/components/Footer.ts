import {AiEditorOptions, AiEditorEvent} from "../core/AiEditor.ts";
import {EditorEvents} from "@tiptap/core";


export class Footer extends HTMLElement implements AiEditorEvent {
    count: number = 0
    // shadow:ShadowRoot;

    constructor() {
        super();
        // this. shadow = this.attachShadow({
        //     mode:"closed"
        // });

    }

    updateCharacters() {
        this.innerHTML = `
        <div> 
            Powered by AiEditor, Characters: ${this.count}
        </div>
        `;
        // this.querySelector("div")!
        //     .innerHTML = `
        //          Powered by AiEditor, Characters: ${this.count}
        //     `;
    }

    onCreate(props: EditorEvents["create"], _: AiEditorOptions): void {
        this.count = props.editor.storage.characterCount.characters()
        this.updateCharacters()
    }

    onTransaction(props: EditorEvents["transaction"]): void {
        const newCount = props.editor.storage.characterCount.characters();
        if (newCount != this.count) {
            this.count = newCount
            this.updateCharacters()
        }
    }

}



