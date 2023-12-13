import {AbstractBubbleMenu} from "../AbstractBubbleMenu.ts";
import {Popover} from "../../commons/Popover.ts";
import {EditorEvents} from "@tiptap/core";
import {t} from "i18next";


export class LinkBubbleMenu extends AbstractBubbleMenu {
    constructor() {
        super();
        this.items = [
            {
                id: "edit",
                title: t("edit-link"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M6.41421 15.89L16.5563 5.74786L15.1421 4.33365L5 14.4758V15.89H6.41421ZM7.24264 17.89H3V13.6474L14.435 2.21233C14.8256 1.8218 15.4587 1.8218 15.8492 2.21233L18.6777 5.04075C19.0682 5.43128 19.0682 6.06444 18.6777 6.45497L7.24264 17.89ZM3 19.89H21V21.89H3V19.89Z\"></path></svg>",
            },
            {
                id: "unlink",
                title: t("unlink"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M17 17H22V19H19V22H17V17ZM7 7H2V5H5V2H7V7ZM18.364 15.5355L16.9497 14.1213L18.364 12.7071C20.3166 10.7545 20.3166 7.58866 18.364 5.63604C16.4113 3.68342 13.2455 3.68342 11.2929 5.63604L9.87868 7.05025L8.46447 5.63604L9.87868 4.22183C12.6123 1.48816 17.0445 1.48816 19.7782 4.22183C22.5118 6.9555 22.5118 11.3877 19.7782 14.1213L18.364 15.5355ZM15.5355 18.364L14.1213 19.7782C11.3877 22.5118 6.9555 22.5118 4.22183 19.7782C1.48816 17.0445 1.48816 12.6123 4.22183 9.87868L5.63604 8.46447L7.05025 9.87868L5.63604 11.2929C3.68342 13.2455 3.68342 16.4113 5.63604 18.364C7.58866 20.3166 10.7545 20.3166 12.7071 18.364L14.1213 16.9497L15.5355 18.364ZM14.8284 7.75736L16.2426 9.17157L9.17157 16.2426L7.75736 14.8284L14.8284 7.75736Z\"></path></svg>",
            },
            {
                id: "visit",
                title: t("visit-link"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z\"></path></svg>",
            }
        ]
    }

    connectedCallback() {
        super.connectedCallback();

        const popover = new Popover();
        popover.setContent(`
            <div style="width: 250px">${t("link-address")} </div>
             <div style="width: 250px">
             <input type="text" id="href" style="width: 250px">
            </div>
            
            <div style="margin-top: 10px">${t("link-open-type")}</div>
            <div>
            <select id="target" style="width: 250px">
                <option value="">${t("default")}</option>
                <option value="_blank">${t("link-open-blank")}</option>
            </select>
            </div>
        `);

        popover.onConfirmClick((instance) => {
            const href = (instance.popper.querySelector("#href") as HTMLInputElement).value;
            if (href.trim() === "") {
                this.editor?.chain().focus().extendMarkRange('link')
                    .unsetLink()
                    .run()
                return;
            }

            let target: string | null = (instance.popper.querySelector("#target") as HTMLInputElement).value;
            if (target.trim() === "") {
                target = null;
            }

            this.editor?.chain().focus().extendMarkRange("link")
                .setLink({
                    href,
                    target,
                    rel: null,
                }).run()
        });


        popover.onShow((instance) => {
            const attrs = this.editor?.getAttributes("link");
            if (attrs && attrs.href) {
                (instance.popper.querySelector("#href") as HTMLInputElement).value = attrs.href;
            }
            if (attrs && attrs.target) {
                (instance.popper.querySelector("#target") as HTMLInputElement).value = attrs.target;
            }
        })

        popover.setTrigger(this.querySelector("#edit")!, "right");
    }

    onItemClick(id: string): void {
        if (id === "unlink") {
            this.editor?.chain().focus().unsetLink().run();
        } else if (id === "visit") {
            window.open(this.editor?.getAttributes("link").href, "_blank")
        }
    }

    onTransaction(_: EditorEvents["transaction"]): void {

    }

}



