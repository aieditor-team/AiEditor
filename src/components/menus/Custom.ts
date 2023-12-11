import {AbstractMenuButton} from "../AbstractMenuButton.ts";
import {CustomMenu, InnerEditor} from "../../core/AiEditor.ts";

export class Custom extends AbstractMenuButton {

    config?: CustomMenu;

    constructor() {
        super();
    }

    onConfig(customMenu: CustomMenu) {
        this.config = customMenu;

        if (customMenu.html) {
            this.template = customMenu.html;
        } else if (customMenu.icon) {
            this.template = `<div style="height: 16px">${customMenu.icon}</div>`;
        }

        this.addEventListener("click", (e) => {
            if (this.config && this.config.onClick) {
                this.config.onClick(e, (this.editor as InnerEditor).aiEditor);
            }
        })
    }

}


