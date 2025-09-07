import {AbstractMenuButton} from "../AbstractMenuButton.ts";

export class IndentIncrease extends AbstractMenuButton {
    constructor() {
        super();
        this.template = `
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 4H21V6H3V4ZM3 19H21V21H3V19ZM11 14H21V16H11V14ZM11 9H21V11H11V9ZM7 12.5L3 16V9L7 12.5Z"></path></svg>
        </div>
        `;
        this.registerClickListener();
    }

    // @ts-ignore
    onClick(commands) {
        if (this.editor?.isActive('bulletList') || this.editor?.isActive('orderedList')) {
            commands.sinkListItem(this.editor?.schema.nodes.listItem);
        } else {
            commands.indent();
        }
    }

}


