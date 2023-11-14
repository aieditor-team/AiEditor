import {AiEditorOptions, AiEditorEvent} from "../core/AiEditor.ts";
import {EditorEvents} from "@tiptap/core";


export class Footer extends HTMLElement implements AiEditorEvent {

    count: number = 0

    constructor() {
        super();

        let startX: number, startY: number, minWidth = 300, minHeight = 300, rootWith: number, rootHeight: number,
            root: HTMLElement;
        const onMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            document.removeEventListener("mouseup", onMouseUp);
            document.removeEventListener("mousemove", onMousemove);
        }

        const onMousemove = (event: MouseEvent) => {
            const distanceX = event.clientX - startX;
            const distanceY = event.clientY - startY;

            if (distanceX == 0 && distanceY == 0) return;

            let newWidth = rootWith + distanceX;
            let newHeight = rootHeight + distanceY;

            if (newWidth < minWidth) {
                newWidth = minWidth;
            }

            if (newHeight < minHeight) {
                newHeight = minHeight;
            }

            root.style.width = `${newWidth}px`;
            root.style.height = `${newHeight}px`;
        }

        this.addEventListener("mousedown", (e) => {
            const target = (e.target as HTMLElement).closest("svg");
            if (target) {
                e.preventDefault();
                document.addEventListener("mouseup", onMouseUp);
                document.addEventListener("mousemove", onMousemove);
                root = (e.target as HTMLElement).closest(".aie-container")?.parentElement!;
                rootWith = root.clientWidth;
                rootHeight = root.clientHeight;
                startX = e.clientX;
                startY = e.clientY;
            }
        });

        this.addEventListener("mouseup", onMouseUp)
    }

    updateCharacters() {
        this.innerHTML = `
        <div style="display: flex"> 
            <span> Powered by AiEditor, Characters: ${this.count} </span>
            <div style="width: 20px;height: 20px;overflow: hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 16L6 10H18L12 16Z"></path></svg>
            </div>
        </div>
        `;
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



