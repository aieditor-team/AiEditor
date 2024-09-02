import {EditorEvents} from "@tiptap/core";
import {AiEditorOptions, CustomMenu, MenuGroup} from "../../core/AiEditor.ts";
import {AbstractMenuButton} from "../AbstractMenuButton.ts";
import {initToolbarKeys} from "../../util/initToolbarKeys.ts";
import tippy, {Instance} from "tippy.js";


export class Group extends AbstractMenuButton {

    // template:string;
    menuButtons: AbstractMenuButton[] = [];
    tippyInstance?: Instance;
    tippyEl?: HTMLDivElement;
    menuTextWidth: string = "40px";
    defaultMenuIndex: number = 0;
    refreshMenuText: boolean = true;
    width: string = "48px";
    // dropDivWith: string = "100px";
    // dropDivHeight: string = "260px";
    showItemsTip: boolean = false;

    constructor() {
        super();
    }

    onCreate(_: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(_, options);
    }

    initToolbarKeys(event: EditorEvents["create"],
                    options: AiEditorOptions,
                    toolbarKeys: (string | CustomMenu | MenuGroup)[]) {
        initToolbarKeys(event, options, this.menuButtons, toolbarKeys)
    }

    renderTemplate() {
        this.template = `
         <div id="tippy" >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C11.175 3 10.5 3.675 10.5 4.5C10.5 5.325 11.175 6 12 6C12.825 6 13.5 5.325 13.5 4.5C13.5 3.675 12.825 3 12 3ZM12 18C11.175 18 10.5 18.675 10.5 19.5C10.5 20.325 11.175 21 12 21C12.825 21 13.5 20.325 13.5 19.5C13.5 18.675 12.825 18 12 18ZM12 10.5C11.175 10.5 10.5 11.175 10.5 12C10.5 12.825 11.175 13.5 12 13.5C12.825 13.5 13.5 12.825 13.5 12C13.5 11.175 12.825 10.5 12 10.5Z"></path></svg>
         </div>
        `
    }

    onTransaction(event: EditorEvents["transaction"]) {
        for (let menuButton of this.menuButtons) {
            menuButton.onTransaction(event);
        }
    }

    connectedCallback() {
        this.renderTemplate();
        super.connectedCallback();

        this.tippyInstance = tippy(this.querySelector("#tippy")!, {
            content: this.createMenuElement(),
            appendTo: this.closest(".aie-container")!,
            placement: 'bottom',
            trigger: 'click',
            interactive: true,
            arrow: false,
        })
    }


    createMenuElement() {
        const div = document.createElement("div");
        div.classList.add("aie-dropdown-container");

        for (let i = 0; i < this.menuButtons.length; i++) {

            const button = this.menuButtons[i];

            const item = document.createElement("div");
            item.classList.add("aie-dropdown-item");
            item.style.padding = "5px 10px"
            item.style.lineHeight = "16px"

            item.appendChild(button);

            const itemTextWrapper = document.createElement("div");
            itemTextWrapper.innerText = button.getAttribute("data-title")!
            itemTextWrapper.style.marginLeft = "5px";
            item.appendChild(itemTextWrapper);

            item.addEventListener("click", () => {
                button.click();
                this.tippyInstance!.hide()
            });

            div.appendChild(item)
        }
        this.tippyEl = div;
        return div;
    }


}

