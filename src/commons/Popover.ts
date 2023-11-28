import tippy, {Instance, Placement} from "tippy.js";
import {t} from "i18next";


export class Popover {

    tippyInstance?: Instance;
    content?: string;
    onConfirmClickFunc?: (instance: Instance) => void;
    onShowFunc?: (instance: Instance) => void;


    setContent(content: string) {
        this.content = content;
    }

    onConfirmClick(onConfirmClick: (instance: Instance) => void) {
        this.onConfirmClickFunc = onConfirmClick;
    }

    onShow(onShow: (instance: Instance) => void) {
        this.onShowFunc = onShow;
    }

    setTrigger(triggerEl: HTMLElement, placement: Placement = "bottom") {
        this.tippyInstance = tippy(triggerEl, {
            content: this.createContentElement(),
            appendTo: triggerEl.closest(".aie-container")!,
            placement: placement,
            trigger: 'click',
            interactive: true,
            arrow: false,
            onShow: (_) => {
                this.onShowFunc && this.onShowFunc(_)
            }
        })
    }

    createContentElement() {
        const template = `
            <div class="aie-popover">
              <div class="aie-popover-header">
               <svg class="aie-popover-header-close" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.0007 10.5865L16.9504 5.63672L18.3646 7.05093L13.4149 12.0007L18.3646 16.9504L16.9504 18.3646L12.0007 13.4149L7.05093 18.3646L5.63672 16.9504L10.5865 12.0007L5.63672 7.05093L7.05093 5.63672L12.0007 10.5865Z"></path></svg>
              </div>
              <div class="aie-popover-content">${this.content}</div>
              <div class="aie-popover-footer">
              <button class="aie-popover-footer-confirm" type="button">${t("confirm")}</button>
              </div>
            </div>
        `;

        const container = document.createElement("div");
        container.innerHTML = template;

        container.querySelector(".aie-popover-header-close")!
            .addEventListener("click", () => {
                this.tippyInstance!.hide();
            })

        container.querySelector(".aie-popover-footer-confirm")!
            .addEventListener("click", () => {
                this.onConfirmClickFunc && this.onConfirmClickFunc(this.tippyInstance!);
                this.tippyInstance!.hide();
            })

        return container;
    }
}






