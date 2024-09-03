import {EditorEvents} from "@tiptap/core";
import {AiEditorOptions, MenuGroup} from "../../core/AiEditor.ts";
import {AbstractMenuButton} from "../AbstractMenuButton.ts";
import {initToolbarKeys} from "../../util/initToolbarKeys.ts";
import tippy, {Instance} from "tippy.js";


export class Group extends AbstractMenuButton {

    menuButtons: AbstractMenuButton[] = [];
    tippyInstance?: Instance;
    tippyEl?: HTMLDivElement;
    iconSvg?: string = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C11.175 3 10.5 3.675 10.5 4.5C10.5 5.325 11.175 6 12 6C12.825 6 13.5 5.325 13.5 4.5C13.5 3.675 12.825 3 12 3ZM12 18C11.175 18 10.5 18.675 10.5 19.5C10.5 20.325 11.175 21 12 21C12.825 21 13.5 20.325 13.5 19.5C13.5 18.675 12.825 18 12 18ZM12 10.5C11.175 10.5 10.5 11.175 10.5 12C10.5 12.825 11.175 13.5 12 13.5C12.825 13.5 13.5 12.825 13.5 12C13.5 11.175 12.825 10.5 12 10.5Z"></path></svg>`;

    constructor() {
        super();
    }

    onCreate(_: EditorEvents["create"], options: AiEditorOptions) {
        super.onCreate(_, options);
    }

    init(event: EditorEvents["create"], options: AiEditorOptions, mg: MenuGroup) {
        initToolbarKeys(event, options, this.menuButtons, mg.toolbarKeys)
        this.iconSvg = mg.icon || this.iconSvg;
    }

    renderTemplate() {
        this.template = `<div id="tippy" >${this.iconSvg}</div>`
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

            item.addEventListener("click", (evt) => {
                const target: HTMLDivElement = (evt.target as any).closest('.aie-menu-item');
                if (target) {
                    return;
                }

                const tippy = item.querySelector("#tippy");
                if (tippy) {
                    (tippy as HTMLElement).click();
                    return;
                }

                const dropdown = item.querySelector("#dropdown");
                if (dropdown) {
                    (dropdown as HTMLElement).click();
                    return;
                }

                button.click();
            });

            div.appendChild(item)
        }
        this.tippyEl = div;
        return div;
    }


}

