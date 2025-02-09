import { EditorEvents } from "@tiptap/core";
import { AiEditorOptions, InnerEditor } from "../../core/AiEditor";
import {AbstractMenuButton} from "../AbstractMenuButton";
import { createTocList, handleTocClick, type ITocItem } from "../../extensions/TocGenerator";


/** Table of contents */
export class TocMenuButton extends AbstractMenuButton {
    constructor() {
        super();
        this.template = `
        <div>
            <svg t="1736825639680" class="icon" viewBox="0 0 1024 1024" style="width:24px;height:24px" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5163" width="200" height="200"><path d="M370.1 371.5h-49.6c-3.1 0-5.7-2.5-5.7-5.7v-49.6c0-3.1 2.5-5.7 5.7-5.7h49.6c3.1 0 5.7 2.5 5.7 5.7v49.6c0 3.1-2.6 5.7-5.7 5.7z m333.5-7.6H460.5c-3.1 0-5.7-2.5-5.7-5.7v-34.5c0-3.1 2.5-5.7 5.7-5.7h243.2c3.1 0 5.7 2.5 5.7 5.7v34.5c-0.1 3.2-2.7 5.7-5.8 5.7zM370.1 712.4h-49.6c-3.1 0-5.7-2.5-5.7-5.7v-49.6c0-3.1 2.5-5.7 5.7-5.7h49.6c3.1 0 5.7 2.5 5.7 5.7v49.6c0 3.2-2.6 5.7-5.7 5.7z m333.5-7.5H460.5c-3.1 0-5.7-2.5-5.7-5.7v-34.5c0-3.1 2.5-5.7 5.7-5.7h243.2c3.1 0 5.7 2.5 5.7 5.7v34.5c-0.1 3.1-2.7 5.7-5.8 5.7zM370.1 542.5h-49.6c-3.1 0-5.7-2.5-5.7-5.7v-49.6c0-3.1 2.5-5.7 5.7-5.7h49.6c3.1 0 5.7 2.5 5.7 5.7v49.6c0 3.1-2.6 5.7-5.7 5.7z m333.5-7.6H460.5c-3.1 0-5.7-2.5-5.7-5.7v-34.5c0-3.1 2.5-5.7 5.7-5.7h243.2c3.1 0 5.7 2.5 5.7 5.7v34.5c-0.1 3.2-2.7 5.7-5.8 5.7z" p-id="5164"></path><path d="M847.1 560.4V250.1s0-24.7-14-46.4c-10.8-16.8-30-31.8-64.2-31.8h-261c-0.2 0-0.3 0-0.5 0.1H255s-78.1 0-78.1 78.1l0.1 213.4V774s0 24.7 13.9 46.3c10.8 16.8 30 31.8 64.2 31.8h261.1c0.2 0 0.3 0 0.5-0.1H769s78.1 0 78.1-78.1l-0.1-213.4 0.1-0.1z m-39 213.6c-1.3 38.5-38.9 39-38.9 39h-514c-1.3-0.1-2.5-0.2-3.8-0.3-5.4-1.1-15.7-4.1-23.9-11.7-9-9.7-11.2-22.3-11.7-26.1v-0.7l0.1-524.2c1.3-38.5 38.9-39 38.9-39h514c1.3 0.1 2.5 0.2 3.7 0.3 5.4 1.1 15.7 4.1 23.9 11.7 9 9.7 11.2 22.2 11.7 26 0 0.2 0 0.5 0.1 0.7l-0.1 524.3z" p-id="5165"></path></svg>
        </div>
        `;
        this.registerClickListener();
    }

    private createView(tocItems: ITocItem[] | undefined = []) {
        const tocDiv = document.querySelector(".aie-container__toc");
        if (!tocDiv) {
            return;
        }

        tocDiv.innerHTML = "";

        if (tocItems.length === 0) {
            return;
        }
        
        const tocElement = document.createElement("div");
        tocElement.setAttribute("tableOfContents", "");
        tocElement.classList.add("table-of-contents");

        const tocRows = createTocList(tocItems);
        tocElement.innerHTML = tocRows;
        tocElement.addEventListener("click", handleTocClick);

        tocDiv.appendChild(tocElement);
    }

    onClick() {
        const isActive = !!this.querySelector("div.active");
        this.toggleActiveView(!isActive);
    }
    
    /**
     * 切换到新的状态
     * @param isActive 
     * @returns
     */
    private toggleActiveView(isActive: Boolean) {
        const htmlDivElement = this.querySelector("div");
        if (!htmlDivElement) return;
        if (isActive) {
            htmlDivElement.classList.add("active")
            const editor = this.editor as InnerEditor;
            editor.commands.generateToc();
            const tocStorage = editor.storage.tocGenerator;
            this.createView(tocStorage.tocItems)
        } else {
            htmlDivElement.classList.remove("active")
            this.createView()
        }
    }
    
    onCreate(props: EditorEvents["create"], options: AiEditorOptions): void {
        super.onCreate(props, options);

        setTimeout(() => {
            if (options.toc?.visible) {
                this.toggleActiveView(true);
            }
        });
    }
    
    onTransaction(event: EditorEvents["transaction"]): void {
        const {transaction} = event;
        if (!transaction.docChanged) {
            return;
        }
        const isActive = !!this.querySelector("div.active");
        if (isActive) {
            this.toggleActiveView(true);
        }        
    }
}
