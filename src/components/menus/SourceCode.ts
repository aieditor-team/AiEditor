import { AbstractMenuButton } from "../AbstractMenuButton.ts";
import { Popover } from "../../commons/Popover.ts";
import { t } from "i18next";
import { Editor } from "@tiptap/core";

export class SourceCode extends AbstractMenuButton {
    constructor() {
        super();
        const template = `
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M14 9V3L21 12L14 21V15.9C9 15.9 5.5 17.7 3 20.9V23H10V19C10 15.7 12.6 13 16 13C19.4 13 22 15.7 22 19V21H23V19C23 14.9 19.6 12.1 16 12C12.4 11.9 9 14.7 9 18.1V19L2 12L9 5V9.1C15 9.7 18.5 11.4 21 15.1V3H23V15.1C20.5 11.3 17 9 14 9Z"></path>
            </svg>
        </div>
        `;
        this.template = template;
    }

    connectedCallback() {
        super.connectedCallback();
        const popover = new Popover();
        popover.setContent(`
            <div style="width: 850px">${t("source-code")}</div>
            <div style="padding: 10px;">
                <textarea id="source-code" style="width: 100%; height: 260px;"></textarea>
            </div>
        `);
        popover.onConfirmClick((instance) => {
            const textarea = instance.popper.querySelector("#source-code") as HTMLTextAreaElement;
            this.editor?.commands.setContent(textarea.value)
        });

        popover.onShow((instance) => {
            const attrs = this.editor?.getAttributes("source-code");
            if (attrs) {
                (instance.popper.querySelector("#source-code") as HTMLDivElement).textContent = this.editor?.getHTML() || "";
            } else {
                (instance.popper.querySelector("#source-code") as HTMLDivElement).textContent = "";
            }
        });

        popover.setTrigger(this.querySelector("div")!, "bottom");
    }

    onActive(editor: Editor): boolean {
        return editor.isActive("source-code");
    }
}