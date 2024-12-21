import {BubbleMenuItem} from "../../types.ts";
import {Popover} from "../../../../commons/Popover.ts";
import {t} from "i18next";

export const ImageLink = {
    id: "imageLink",
    title: "link",
    icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M17.6572 14.8282L16.2429 13.414L17.6572 11.9998C19.2193 10.4377 19.2193 7.90506 17.6572 6.34296C16.0951 4.78086 13.5624 4.78086 12.0003 6.34296L10.5861 7.75717L9.17188 6.34296L10.5861 4.92875C12.9292 2.5856 16.7282 2.5856 19.0714 4.92875C21.4145 7.27189 21.4145 11.0709 19.0714 13.414L17.6572 14.8282ZM14.8287 17.6567L13.4145 19.0709C11.0714 21.414 7.27238 21.414 4.92923 19.0709C2.58609 16.7277 2.58609 12.9287 4.92923 10.5856L6.34345 9.17139L7.75766 10.5856L6.34345 11.9998C4.78135 13.5619 4.78135 16.0946 6.34345 17.6567C7.90555 19.2188 10.4382 19.2188 12.0003 17.6567L13.4145 16.2425L14.8287 17.6567ZM14.8287 7.75717L16.2429 9.17139L9.17188 16.2425L7.75766 14.8282L14.8287 7.75717Z\"></path></svg>",
    isActive: (editor) => {
        const attrs = editor?.getAttributes("image");
        return !!(attrs && attrs.href)
    },
    onInit: ({innerEditor: editor}, _tippyInstance, parentEle) => {
        const popover = new Popover();
        popover.setContent(`
            <div style="width: 250px">${t("link-address")}</div>
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

        popover.cancelText = `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M17 17H22V19H19V22H17V17ZM7 7H2V5H5V2H7V7ZM18.364 15.5355L16.9497 14.1213L18.364 12.7071C20.3166 10.7545 20.3166 7.58866 18.364 5.63604C16.4113 3.68342 13.2455 3.68342 11.2929 5.63604L9.87868 7.05025L8.46447 5.63604L9.87868 4.22183C12.6123 1.48816 17.0445 1.48816 19.7782 4.22183C22.5118 6.9555 22.5118 11.3877 19.7782 14.1213L18.364 15.5355ZM15.5355 18.364L14.1213 19.7782C11.3877 22.5118 6.9555 22.5118 4.22183 19.7782C1.48816 17.0445 1.48816 12.6123 4.22183 9.87868L5.63604 8.46447L7.05025 9.87868L5.63604 11.2929C3.68342 13.2455 3.68342 16.4113 5.63604 18.364C7.58866 20.3166 10.7545 20.3166 12.7071 18.364L14.1213 16.9497L15.5355 18.364ZM14.8284 7.75736L16.2426 9.17157L9.17157 16.2426L7.75736 14.8284L14.8284 7.75736Z\"></path></svg>
${t("unlink")}`;
        popover.onCancelClick(() => {
            editor.chain().updateAttributes("image", {
                href: null,
                target: null,
            }).run()
        })


        popover.onConfirmClick((instance) => {
            const href = (instance.popper.querySelector("#href") as HTMLInputElement).value;
            if (href.trim() === "") {
                editor.chain().updateAttributes("image", {
                    href: null,
                }).run()
                return;
            }

            let target: string | null = (instance.popper.querySelector("#target") as HTMLInputElement).value;
            if (target.trim() === "") {
                target = null;
            }

            editor.chain()
                .updateAttributes("image", {
                    href,
                    target,
                }).run()
        });

        popover.onShow((instance) => {
            const attrs = editor?.getAttributes("image");
            if (attrs && attrs.href) {
                (instance.popper.querySelector("#href") as HTMLInputElement).value = attrs.href;
            } else {
                (instance.popper.querySelector("#href") as HTMLInputElement).value = "";
            }
            if (attrs && attrs.target) {
                (instance.popper.querySelector("#target") as HTMLInputElement).value = attrs.target;
            } else {
                (instance.popper.querySelector("#target") as HTMLInputElement).value = "";
            }
        })

        popover.setTrigger(parentEle.querySelector("#imageLink")!, "bottom");
    },
} as BubbleMenuItem;
