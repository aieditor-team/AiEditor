import {AbstractMenuButton} from "./AbstractMenuButton.ts";
import tippy from "tippy.js";
import {t} from "i18next";


const colors = [
        'ffffff', '000000', 'e9d989', '2972f4', '609eec', 'de3c36', 'a1d533', '7334c5', '27b5d9', 'ff8926',
        'f2f2f2', '7f7f7f', 'ddd9c3', 'c6d9f0', 'dbe5f1', 'f2dcdb', 'ebf1dd', 'e5e0ec', 'dbeef3', 'fdeada',
        'd8d8d8', '595959', 'c4bd97', '8db3e2', 'b8cce4', 'e5b9b7', 'd7e3bc', 'ccc1d9', 'b7dde8', 'fbd5b5',
        'bfbfbf', '3f3f3f', '938953', '548dd4', '95b3d7', 'd99694', 'c3d69b', 'b2a2c7', '92cddc', 'fac08f',
        'a5a5a5', '262626', '494429', '17365d', '366092', '953734', '76923c', '5f497a', '31859b', 'e36c09',
        '6e6e6e', '0c0c0c', '1d1b10', '0f243e', '244061', '632423', '4f6128', '3f3151', '205867', '974806'],
    standardColors = ['c00000', 'ff0000', 'ffc000', 'ffff00', '92d050', '00b050', '00b0f0', '0070c0', '002060', '7030a0'];

export class AbstractColorsMenuButton extends AbstractMenuButton {

    historyColorsKey = "historyColors";

    historyColors: string[] = [];

    iconSvg?: string;

    menuColorEL?: HTMLDivElement;

    onColorItemClick?: (color: string) => void;

    onDefaultColorClick?: () => void;

    constructor() {
        super();
    }

    connectedCallback() {
        this.template = `
            <div style="width: 36px;height: 18px;display: flex;padding-right: 0">
                <div style="width: 18px;height: 18px" class="currentColor">
                    <div style="height: 15px;width: 15px;padding:0 1.5px;line-height: 18px">${this.iconSvg}</div>
                    <div style="width: 18px;height: 3px;background: #333" id="menuColorEL"></div>
                </div>
                <div style="width: 18px;height: 18px" id="dropdown">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 14L8 10H16L12 14Z"></path></svg>
                </div>
            </div>
            `
        super.connectedCallback();

        const localStorageColors = localStorage.getItem(this.historyColorsKey);
        if (localStorageColors) {
            this.historyColors = JSON.parse(localStorageColors);
        }

        this.querySelector(".currentColor")!.addEventListener("click", () => {
            this.onColorItemClick!(this.historyColors.length > 0 ? this.historyColors[0] : '#ccc')
        });

        this.menuColorEL = this.querySelector("#menuColorEL")!;
        if (this.historyColors && this.historyColors.length > 0) {
            this.menuColorEL!.style.background = this.historyColors[0];
        }

        tippy(this.querySelector("#dropdown")!, {
            content: this.createMenuElement(),
            placement: 'bottom',
            trigger: 'click',
            interactive: true,
            arrow: false,
        })
    }

    createMenuElement() {
        const div = document.createElement("div");
        div.style.height = "278px"
        div.style.width = "250px"
        div.classList.add("aie-dropdown-container")
        div.innerHTML = `
        <div class="color-panel">
            <div class="color-panel-default-button" id="defaultColor">${t("default")}</div>
            <div style="display: flex;flex-wrap: wrap;padding-top: 5px">
                ${colors.map((color, index) => {
            return `<div class="color-item" data-color="#${color}" style="width: 18px;height:18px;margin:1px;padding:1px;border:1px solid #${index == 0 ? 'efefef' : color};background: #${color}"></div>`
        }).join(" ")
        }
            </div>
            <div class="color-panel-title">${t("standardColors")}</div>
            <div style="display: flex;flex-wrap: wrap;">
                ${standardColors.map((color) => {
            return `<div class="color-item" data-color="#${color}" style="width: 18px;height:18px;margin:1px;padding:1px;border:1px solid #${color};background: #${color}"></div>`
        }).join(" ")
        }
            </div>
            <div class="color-panel-title">${t("historyColors")}</div>
            <div style="display: flex;flex-wrap: wrap;" id="history-colors">
               ${this.historyColors.map((color) => {
            return `<div class="history-color-item" data-color="${color}" style="width: 22px;height: 23px;margin: 1px;background: ${color}"></div>`
        }).join(" ")
        }
            </div>
        </div>
        `;

        div.querySelector("#defaultColor")!.addEventListener("click", () => {
            this.onDefaultColorClick!();
        })

        div.querySelectorAll(".color-item").forEach((element) => {
            element.addEventListener("click", () => {
                this.invokeColorItemClick(div, element as HTMLDivElement);
            })
            element.addEventListener("mouseover", () => {
                (element as HTMLDivElement).style.border = "solid 1px #999"
            })
            element.addEventListener("mouseout", () => {
                let color = element.getAttribute("data-color");
                if (color === '#ffffff') color = '#efefef';
                (element as HTMLDivElement).style.border = `solid 1px ${color}`
            })
        })

        div.querySelector("#history-colors")!.addEventListener("click", (e) => {
            const target: HTMLDivElement = (e.target as any).closest('.history-color-item'); // Or any other selector.
            if (target) {
                this.invokeColorItemClick(div, target);
            }
        });
        return div;
    }


    invokeColorItemClick(rootDiv: HTMLDivElement, item: HTMLDivElement) {
        const color = item.getAttribute("data-color");
        this.historyColors = this.historyColors.filter(obj => obj !== color)
        this.historyColors.unshift(color!)
        if (this.historyColors.length > 7) {
            this.historyColors = this.historyColors.slice(0, 7);
        }
        rootDiv.querySelector("#history-colors")!.innerHTML = `
                ${this.historyColors.map((color) => {
            return `<div class="history-color-item" data-color="${color}" style="width: 22px;height: 23px;margin: 1px;background: ${color}"></div>`
        }).join(" ")
        }
                `;
        localStorage.setItem(this.historyColorsKey, JSON.stringify(this.historyColors));
        this.menuColorEL!.style.background = color as string;
        this.onColorItemClick!(color!);
    }

}


