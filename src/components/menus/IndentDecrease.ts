import {AbstractMenuButton} from "../AbstractMenuButton.ts";

export class IndentDecrease extends AbstractMenuButton {
    constructor() {
        super();
        this.template = `
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 4H21V6H3V4ZM3 19H21V21H3V19ZM11 14H21V16H11V14ZM11 9H21V11H11V9ZM3 12.5L7 9V16L3 12.5Z"></path></svg>
         </div>
        `;
        this.registerClickListener();
    }

    // @ts-ignore
    onClick(commands) {
        if (this.editor?.isActive('bulletList') || this.editor?.isActive('orderedList')) {
            commands.liftListItem(this.editor?.schema.nodes.listItem!);
        } else {
            commands.outdent();
        }
    }

}


