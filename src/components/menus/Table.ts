import { t } from "i18next";
import {AbstractMenuButton} from "../AbstractMenuButton.ts";
import tippy, {Instance} from "tippy.js";

export class Table extends AbstractMenuButton {

    instance?: Instance;

    constructor() {
        super();
        const template = `
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 10H10V14H14V10ZM16 10V14H19V10H16ZM14 19V16H10V19H14ZM16 19H19V16H16V19ZM14 5H10V8H14V5ZM16 5V8H19V5H16ZM8 10H5V14H8V10ZM8 19V16H5V19H8ZM8 5H5V8H8V5ZM4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3Z"></path></svg>
        </div>
        `;
        this.template = template;
    }


    connectedCallback() {
        super.connectedCallback();
        this.instance = tippy(this.querySelector("svg")!, {
            content: this.createMenuElement(),
            appendTo: this.closest(".aie-container")!,
            placement: 'bottom',
            trigger: 'click',
            interactive: true,
            arrow: false,
        });
    }


    createMenuElement() {
        const div = document.createElement("div");
        div.classList.add("aie-dropdown-container")
        div.innerHTML = `
        <div style="margin: 5px">
            <div style="padding: 5px 0;font-size: 14px;display: flex"><span>${t("insertTable")}</span><span style="margin-left: auto" id="columnRows"></span></div>
            <div style="display: flex;flex-wrap: wrap;width: 240px;height: 200px" id="table-cells">
            ${[...Array(8).keys()].map((_, i) => {
            return [...Array(10).keys()].map((_, j) => {
                return `<div data-i="${i}" data-j="${j}" class="table-cell" style="width: 20px;height: 20px;margin:1px;"></div>`;
            }).join('');
        }).join('')}
            </div>
        </div>
        `;

        const tableCells = div.querySelector("#table-cells")!;
        tableCells.addEventListener("click", (e) => {
            const target: HTMLDivElement = (e.target as any).closest('.table-cell');
            if (target) {
                let i = target.getAttribute("data-i");
                let j = target.getAttribute("data-j");
                this.editor?.commands.insertTable({rows: Number(i) + 1, cols: Number(j) + 1, withHeaderRow: true})
                this.instance?.hide()
            }
        });

        tableCells.addEventListener("mouseover", (e) => {
            const target: HTMLDivElement = (e.target as any).closest('.table-cell');
            if (target) {
                let targetI = Number(target.getAttribute("data-i"));
                let targetJ = Number(target.getAttribute("data-j"));
                const nodeList = tableCells.querySelectorAll("div");
                const querySelector = div.querySelector("#columnRows")!;
                querySelector.textContent = `${targetI + 1} ${t("row")} x ${targetJ + 1} ${t("column")}`
                nodeList.forEach((element) => {
                    let i = Number(element.getAttribute("data-i"));
                    let j = Number(element.getAttribute("data-j"));
                    if (i <= targetI && j <= targetJ) {
                        element.classList.add("active")
                    } else {
                        element.classList.remove("active")
                    }
                })
            }
        })

        tableCells.addEventListener("mouseleave", () => {
            const nodeList = tableCells.querySelectorAll("div");
            nodeList.forEach((element) => {
                element.classList.remove("active")
            })
            const querySelector = div.querySelector("#columnRows")!;
            querySelector.textContent = ""
        })
        return div;
    }


}


