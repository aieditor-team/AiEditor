import {AbstractMenuButton} from "../AbstractMenuButton.ts";
import {Popover} from "../../commons/Popover.ts";

export class SourceCode extends AbstractMenuButton {
    constructor() {
        super();
        this.template = `
        <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2 4C2 3.44772 2.44772 3 3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4ZM4 19H20V9H4V19ZM11 13H6V17H11V13Z"></path></svg>
        </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        const popover = new Popover();
        popover.setContent(`
            <div style="padding: 10px 10px 0 0;width: 850px;max-width: calc(100% - 10px);">
                <textarea id="source-code" style="width: 100%; height: 260px;"></textarea>
            </div>
        `);
        popover.onConfirmClick((instance) => {
            const textarea = instance.popper.querySelector("#source-code") as HTMLTextAreaElement;
            this.editor?.commands.setContent(textarea.value)
        });

        popover.onShow((instance) => {
            (instance.popper.querySelector("#source-code") as HTMLTextAreaElement).value = this.editor?.getHTML() || "";
        });
        popover.setTrigger(this.querySelector("div")!, "bottom");
    }


}