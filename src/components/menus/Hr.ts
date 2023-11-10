import {AbstractMenuButton} from "../AbstractMenuButton.ts";

export class Hr extends AbstractMenuButton {
    constructor() {
        super();
        const template = `
        <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 11H4V13H2V11ZM6 11H18V13H6V11ZM20 11H22V13H20V11Z"></path></svg>
        </div>
        `;
        this.template = template;
        this.registerClickListener();
    }

    // @ts-ignore
    onClick(commands) {
        commands.setHorizontalRule();
    }

}


