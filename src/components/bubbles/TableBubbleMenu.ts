import {AbstractBubbleMenu} from "../AbstractBubbleMenu.ts";
import {EditorEvents} from "@tiptap/core";
import {CellSelection, TableMap} from '@tiptap/pm/tables';
import {EditorView} from "@tiptap/pm/view";
import {t} from "i18next";

export class TableBubbleMenu extends AbstractBubbleMenu {
    constructor() {
        super();
        this.items = [
            {
                id: "insert-column-left",
                title: t("insert-column-left"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H14C13.4477 21 13 20.5523 13 20V4C13 3.44772 13.4477 3 14 3H20ZM19 5H15V19H19V5ZM6 7C8.76142 7 11 9.23858 11 12C11 14.7614 8.76142 17 6 17C3.23858 17 1 14.7614 1 12C1 9.23858 3.23858 7 6 7ZM7 9H5V10.999L3 11V13L5 12.999V15H7V12.999L9 13V11L7 10.999V9Z\"></path></svg>",
            },
            {
                id: "insert-column-right",
                title: t("insert-column-right"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M10 3C10.5523 3 11 3.44772 11 4V20C11 20.5523 10.5523 21 10 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H10ZM9 5H5V19H9V5ZM18 7C20.7614 7 23 9.23858 23 12C23 14.7614 20.7614 17 18 17C15.2386 17 13 14.7614 13 12C13 9.23858 15.2386 7 18 7ZM19 9H17V10.999L15 11V13L17 12.999V15H19V12.999L21 13V11L19 10.999V9Z\"></path></svg>",
            },
            {
                id: "insert-row-top",
                title: t("insert-row-top"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 13C20.5523 13 21 13.4477 21 14V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V14C3 13.4477 3.44772 13 4 13H20ZM19 15H5V19H19V15ZM12 1C14.7614 1 17 3.23858 17 6C17 8.76142 14.7614 11 12 11C9.23858 11 7 8.76142 7 6C7 3.23858 9.23858 1 12 1ZM13 3H11V4.999L9 5V7L11 6.999V9H13V6.999L15 7V5L13 4.999V3Z\"></path></svg>"
            },
            {
                id: "insert-row-bottom",
                title: t("insert-row-bottom"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M12 13C14.7614 13 17 15.2386 17 18C17 20.7614 14.7614 23 12 23C9.23858 23 7 20.7614 7 18C7 15.2386 9.23858 13 12 13ZM13 15H11V16.999L9 17V19L11 18.999V21H13V18.999L15 19V17L13 16.999V15ZM20 3C20.5523 3 21 3.44772 21 4V10C21 10.5523 20.5523 11 20 11H4C3.44772 11 3 10.5523 3 10V4C3 3.44772 3.44772 3 4 3H20ZM5 5V9H19V5H5Z\"></path></svg>"
            },
            {
                id: "delete-column",
                title: t("delete-column"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M12 3C12.5523 3 13 3.44772 13 4L12.9998 11.9998C13.8355 11.372 14.8743 11 16 11C18.7614 11 21 13.2386 21 16C21 18.7614 18.7614 21 16 21C14.9681 21 14.0092 20.6874 13.2129 20.1518L13 20C13 20.5523 12.5523 21 12 21H6C5.44772 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3H12ZM11 5H7V19H11V5ZM19 15H13V17H19V15Z\"></path></svg>"
            },
            {
                id: "delete-row",
                title: t("delete-row"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 5C20.5523 5 21 5.44772 21 6V12C21 12.5523 20.5523 13 20 13C20.628 13.8355 21 14.8743 21 16C21 18.7614 18.7614 21 16 21C13.2386 21 11 18.7614 11 16C11 14.8743 11.372 13.8355 11.9998 12.9998L4 13C3.44772 13 3 12.5523 3 12V6C3 5.44772 3.44772 5 4 5H20ZM13 15V17H19V15H13ZM19 7H5V11H19V7Z\"></path></svg>"
            },
            {
                id: "merge-cells-horizontal",
                title: t("merge-cells-horizontal"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20ZM11 5H5V10.999H7V9L10 12L7 15V13H5V19H11V17H13V19H19V13H17V15L14 12L17 9V10.999H19V5H13V7H11V5ZM13 13V15H11V13H13ZM13 9V11H11V9H13Z\"></path></svg>"
            },
            {
                id: "merge-cells-vertical",
                title: t("merge-cells-vertical"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V20ZM19 11V5H13.001V7H15L12 10L9 7H11V5H5V11H7V13H5V19H11V17H9L12 14L15 17H13.001V19H19V13H17V11H19ZM11 13H9V11H11V13ZM15 13H13V11H15V13Z\"></path></svg>"
            },
            {
                id: "split-cells-horizontal",
                title: t("split-cells-horizontal"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20ZM11 5H5V19H11V15H13V19H19V5H13V9H11V5ZM15 9L18 12L15 15V13H9V15L6 12L9 9V11H15V9Z\"></path></svg>"
            },
            {
                id: "split-cells-vertical",
                title: t("split-cells-vertical"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20ZM19 5H5V10.999L9 11V13H5V19H19V13H15V11L19 10.999V5ZM12 6L15 9H13V15H15L12 18L9 15H11V9H9L12 6Z\"></path></svg>"
            },
            {
                id: "delete",
                title: t("delete-table"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z\"></path></svg>"
            }
        ]
    }

    connectedCallback() {
        this.style.display = "none"
        super.connectedCallback();
    }


    onItemClick(id: string): void {
        if (id === "insert-column-left") {
            this.editor?.chain().focus().addColumnBefore().run()
        } else if (id === "insert-column-right") {
            this.editor?.chain().focus().addColumnAfter().run()
        } else if (id === "insert-row-top") {
            this.editor?.chain().focus().addRowBefore().run()
        } else if (id === "insert-row-bottom") {
            this.editor?.chain().focus().addRowAfter().run()
        } else if (id === "delete-column") {
            this.editor?.chain().focus().deleteColumn().run()
        } else if (id === "delete-row") {
            this.editor?.chain().focus().deleteRow().run()
        } else if (id === "merge-cells-horizontal" || id === "merge-cells-vertical") {
            this.editor?.chain().focus().mergeCells().run()
        } else if (id === "split-cells-horizontal" || id === "split-cells-vertical") {
            this.editor?.chain().focus().splitCell().run()
        } else if (id === "delete") {
            this.editor?.chain().focus().deleteTable().run()
        }
    }

    show(ids: string[]) {
        if (!ids || ids.length == 0) {
            this.style.display = "none"
        } else {
            this.style.display = ""
        }
        this.querySelectorAll(".aie-bubble-menu-item").forEach((el) => {
            (el as HTMLElement).style.display = "none";
        })

        ids.forEach((id) => {
            const div = this.querySelector(`#${id}`) as HTMLElement;
            if (div) div.style.display = "";
        })

    }

    onTransaction(props: EditorEvents["transaction"]) {
        if (!props.editor.isActive("table")) {
            return;
        }
        const {state: {selection}, view} = props.editor;
        if (selection instanceof CellSelection) {
            if (this.isOneCellSelected(selection)) {
                const showIds = ["insert-column-left", "insert-column-right", "delete-column", "insert-row-top", "insert-row-bottom", "delete-row"];
                if (props.editor.can().splitCell()) {
                    const nodeDOM = view.nodeDOM(selection.$anchorCell.pos) as HTMLTableRowElement;
                    const colspan = nodeDOM.getAttribute("colspan");
                    const rowspan = nodeDOM.getAttribute("rowspan");
                    if (colspan && Number(colspan) > 1) {
                        showIds.push("split-cells-horizontal")
                    } else if (rowspan && Number(rowspan) > 1) {
                        showIds.push("split-cells-vertical")
                    }
                }
                this.show(showIds)
            } else if (this.isAllTableSelected(selection)) {
                this.show(["delete"])
            } else if (this.isColumnSelected(selection, view)) {
                this.show(["insert-column-left", "insert-column-right", "delete-column", "merge-cells-vertical"])
            } else if (this.isRowSelected(selection, view)) {
                this.show(["insert-row-top", "insert-row-bottom", "delete-row", "merge-cells-horizontal"])
            } else {
                this.show(["merge-cells-horizontal"])
            }
        } else {
            this.show(["insert-column-left", "insert-column-right", "delete-column", "insert-row-top", "insert-row-bottom", "delete-row"])
        }
    }

    isAllTableSelected(selection: CellSelection): boolean {
        const map = TableMap.get(selection.$anchorCell.node(-1));
        const cells = map.cellsInRect({
            top: 0,
            left: 0,
            right: map.width,
            bottom: map.height
        });
        return selection.ranges.length == cells.length;
    }

    isOneCellSelected(selection: CellSelection): boolean {
        return selection.ranges.length == 1;
    }

    isColumnSelected(selection: CellSelection, view: EditorView): boolean {
        let left: number = -1;
        for (let range of selection.ranges) {
            if (left == -1) {
                left = view.coordsAtPos(range.$from.pos).left;
            } else if (left != view.coordsAtPos(range.$from.pos).left) {
                return false;
            }
        }
        return true;
    }

    isRowSelected(selection: CellSelection, view: EditorView): boolean {
        let bottom: number = -1;
        for (let range of selection.ranges) {
            if (bottom == -1) {
                bottom = view.coordsAtPos(range.$from.pos).bottom;
            } else if (bottom != view.coordsAtPos(range.$from.pos).bottom) {
                return false;
            }
        }
        return true;
    }

}



