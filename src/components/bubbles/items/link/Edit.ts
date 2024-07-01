import {BubbleMenuItem} from "../../types.ts";
import {t} from "i18next";
import {Popover} from "../../../../commons/Popover.ts";

export const Edit = {
    id: "edit",
    title: "edit-link",
    icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M6.41421 15.89L16.5563 5.74786L15.1421 4.33365L5 14.4758V15.89H6.41421ZM7.24264 17.89H3V13.6474L14.435 2.21233C14.8256 1.8218 15.4587 1.8218 15.8492 2.21233L18.6777 5.04075C19.0682 5.43128 19.0682 6.06444 18.6777 6.45497L7.24264 17.89ZM3 19.89H21V21.89H3V19.89Z\"></path></svg>",
    onInit:(editor, _,parentEle)=>{
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
                editor.innerEditor.chain().focus().extendMarkRange('link')
                    .unsetLink()
                    .run()
                return;
            }

            let target: string | null = (instance.popper.querySelector("#target") as HTMLInputElement).value;
            if (target.trim() === "") {
                target = null;
            }

            editor.innerEditor.chain().focus().extendMarkRange("link")
                .setLink({
                    href,
                    target,
                    rel: null,
                }).run()
        });


        popover.onShow((instance) => {
            const attrs = editor.innerEditor.getAttributes("link");
            if (attrs && attrs.href) {
                (instance.popper.querySelector("#href") as HTMLInputElement).value = attrs.href;
            }
            if (attrs && attrs.target) {
                (instance.popper.querySelector("#target") as HTMLInputElement).value = attrs.target;
            }
        })

        popover.setTrigger(parentEle.querySelector("#edit")!, "right");
    }
} as BubbleMenuItem;