import {AbstractMenuButton} from "../AbstractMenuButton.ts";
import {Editor} from "@tiptap/core";

export class Container extends AbstractMenuButton {
    constructor() {
        super();
        const template = `
        <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 5H4V19H20V5ZM18 15V17H6V15H18Z"></path></svg>
        </div>
        `;
        this.template = template;
        this.registerClickListener();
    }

    // @ts-ignore
    onClick(commands) {
        if (this.editor?.isActive("container")) {
            commands.unsetContainer()
        } else {
            commands.setContainer("warning")
        }
        commands.focus()
    }


    onActive(editor: Editor): boolean {
        return editor.isActive("container")
    }
}


