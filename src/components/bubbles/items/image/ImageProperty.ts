import {BubbleMenuItem} from "../../types.ts";
import {Popover} from "../../../../commons/Popover.ts";
import {t} from "i18next";

export const ImageProperty = {
    id: "imageProperty",
    title: "image-property",
    icon:"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M20 3C20.5523 3 21 3.44772 21 4V5.757L19 7.757V5H5V13.1L9 9.1005L13.328 13.429L11.9132 14.8422L9 11.9289L5 15.928V19H15.533L16.2414 19.0012L17.57 17.671L18.8995 19H19V16.242L21 14.242V20C21 20.5523 20.5523 21 20 21H4C3.45 21 3 20.55 3 20V4C3 3.44772 3.44772 3 4 3H20ZM21.7782 7.80761L23.1924 9.22183L15.4142 17L13.9979 16.9979L14 15.5858L21.7782 7.80761ZM15.5 7C16.3284 7 17 7.67157 17 8.5C17 9.32843 16.3284 10 15.5 10C14.6716 10 14 9.32843 14 8.5C14 7.67157 14.6716 7 15.5 7Z\"></path></svg>",
    onInit: ({innerEditor: editor}, _tippyInstance, parentEle) => {
        const popover = new Popover();
        popover.setContent(`
            <div style="width: 250px">Alt</div>
            <div style="width: 250px">
             <input type="text" id="alt" style="width: 250px">
            </div>
            
            <div style="width: 250px;margin-top: 10px">Title</div>
            <div style="width: 250px">
             <input type="text" id="title" style="width: 250px">
            </div>
            
            <div style="margin-top: 10px">${t('image-size')}</div>
            <div>
            <select id="width" style="width: 250px">
               <option value="">${t('image-keep-current')}</option>
               <option value="auto">${t('image-original-size')}</option>
               <option value="30%">30%</option>
               <option value="50%">50%</option>
               <option value="75%">75%</option>
               <option value="100%">100%</option>
            </select>
            </div>
        `);


        popover.onConfirmClick((instance) => {
            const alt = (instance.popper.querySelector("#alt") as HTMLInputElement).value;
            const title = (instance.popper.querySelector("#title") as HTMLInputElement).value;

            editor.chain().updateAttributes("image",{
                alt,
                title
            }).run()

            let width = (instance.popper.querySelector("#width") as HTMLInputElement).value;
            if (width) {
                editor.chain()
                    .updateAttributes("image", {
                        width,
                    }).run()
            }
        });

        popover.onShow((instance) => {
            const attrs = editor?.getAttributes("image");
            if (attrs){
                (instance.popper.querySelector("#alt") as HTMLInputElement).value = attrs.alt || "";
                (instance.popper.querySelector("#title") as HTMLInputElement).value = attrs.title || "";
            }
        })

        popover.setTrigger(parentEle.querySelector("#imageProperty")!, "bottom");
    },
} as BubbleMenuItem;
