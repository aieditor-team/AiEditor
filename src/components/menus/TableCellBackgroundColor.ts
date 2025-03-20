import {t} from "i18next";
import { InnerEditor } from "../../core/AiEditor.ts";

import { colors, standardColors } from '../AbstractColorsMenuButton.ts';

export class TableCellBackgroundColor {
    // 移除实例属性，只保留静态属性
    private historyColors: string[] = [];
    public editor?: InnerEditor;
    public onClose? : (color?:string) => void;
    
    // 只保留静态属性
    private static historyColorsKey = "cellBackgroundHistoryColors";
    
    // 获取最近使用的颜色
    public static getLastUsedColor(): string | null {
        const localStorageColors = localStorage.getItem(this.historyColorsKey);
        if (localStorageColors) {
            const colors = JSON.parse(localStorageColors);
            return colors.length > 0 ? colors[0] : null;
        }
        return null;
    }

    constructor() {
        // 从本地存储加载历史颜色，使用静态属性
        const localStorageColors = localStorage.getItem(TableCellBackgroundColor.historyColorsKey);
        if (localStorageColors) {
            this.historyColors = JSON.parse(localStorageColors);
        }
    }

    createColorPicker() {
        const div = document.createElement("div");
        div.style.height = "278px";
        div.style.width = "250px";
        div.classList.add("aie-dropdown-container");
        div.innerHTML = `
        <div class="color-panel">
            <div class="color-panel-default-button" id="defaultColor" style=“cursor:pointer;”>${t("default")}</div>
            <div style="display: flex;flex-wrap: wrap;padding-top: 5px">
                ${colors.map((color, index) => {
                    return `<div class="color-item" data-color="#${color}" style="width: 18px;height:18px;margin:1px;padding:1px;border:1px solid #${index == 0 ? 'efefef' : color};background: #${color}"></div>`
                }).join(" ")}
            </div>
            <div class="color-panel-title">${t("standardColors")}</div>
            <div style="display: flex;flex-wrap: wrap;">
                ${standardColors.map((color) => {
                    return `<div class="color-item" data-color="#${color}" style="width: 18px;height:18px;margin:1px;padding:1px;border:1px solid #${color};background: #${color}"></div>`
                }).join(" ")}
            </div>
            <div class="color-panel-title">${t("historyColors")}</div>
            <div style="display: flex;flex-wrap: wrap;" id="history-colors">
               ${this.historyColors.map((color) => {
                    return `<div class="history-color-item" data-color="${color}" style="width: 22px;height: 23px;margin: 1px;background: ${color}"></div>`
                }).join(" ")}
            </div>
        </div>
        `;

        // 添加默认颜色点击事件
        div.querySelector("#defaultColor")!.addEventListener("click", () => {
            this.handleDefaultColor();
        });

        // 添加颜色项点击事件
        div.querySelectorAll(".color-item").forEach((element) => {
            element.addEventListener("click", () => {
                const color = element.getAttribute("data-color")!;
                this.handleColorSelect(color);
            });
            
            element.addEventListener("mouseover", () => {
                (element as HTMLDivElement).style.border = "solid 1px #999";
            });
            
            element.addEventListener("mouseout", () => {
                let color = element.getAttribute("data-color");
                if (color === '#ffffff') color = '#efefef';
                (element as HTMLDivElement).style.border = `solid 1px ${color}`;
            });
        });

        // 添加历史颜色点击事件
        div.querySelector("#history-colors")!.addEventListener("click", (e) => {
            const target: HTMLDivElement = (e.target as any).closest('.history-color-item');
            if (target) {
                const color = target.getAttribute("data-color")!;
                this.handleColorSelect(color);
            }
        });

        return div;
    }

    handleColorSelect(color: string) {
        if (this.editor) {
            this.editor.chain()
                .setCellAttribute('backgroundColor', color)
                .run();
            if (this.onClose) {
                this.onClose(color);
            }
            this.updateHistoryColors(color);
        }
    }

    handleDefaultColor() {
        if (this.editor) {
            this.editor.chain()
                .setCellAttribute('backgroundColor', '')
                .run();

            if (this.onClose) {
                this.onClose();
            }
        }
    }

    private updateHistoryColors(color: string) {
        // 更新历史颜色列表，使用静态属性
        this.historyColors = [color, ...this.historyColors.filter(c => c !== color)].slice(0, 7);
        localStorage.setItem(TableCellBackgroundColor.historyColorsKey, JSON.stringify(this.historyColors));
    }
}