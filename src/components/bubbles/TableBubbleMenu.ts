import {AbstractBubbleMenu} from "../AbstractBubbleMenu.ts";
import {Editor, EditorEvents} from "@tiptap/core";
import {CellSelection, TableMap} from '@tiptap/pm/tables';
import {EditorView} from "@tiptap/pm/view";
import {AiEditorOptions} from "../../core/AiEditor.ts";
import {TableCellBackgroundColor} from "../menus/TableCellBackgroundColor.ts";
import tippy from "tippy.js";

export class TableBubbleMenu extends AbstractBubbleMenu {
    constructor() {
        super();
        this.items = [
            {
                id: "insert-column-left",
                title: "insert-column-left",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H14C13.4477 21 13 20.5523 13 20V4C13 3.44772 13.4477 3 14 3H20ZM19 5H15V19H19V5ZM6 7C8.76142 7 11 9.23858 11 12C11 14.7614 8.76142 17 6 17C3.23858 17 1 14.7614 1 12C1 9.23858 3.23858 7 6 7ZM7 9H5V10.999L3 11V13L5 12.999V15H7V12.999L9 13V11L7 10.999V9Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().addColumnBefore().run()
                }
            },
            {
                id: "insert-column-right",
                title: "insert-column-right",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M10 3C10.5523 3 11 3.44772 11 4V20C11 20.5523 10.5523 21 10 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H10ZM9 5H5V19H9V5ZM18 7C20.7614 7 23 9.23858 23 12C23 14.7614 20.7614 17 18 17C15.2386 17 13 14.7614 13 12C13 9.23858 15.2386 7 18 7ZM19 9H17V10.999L15 11V13L17 12.999V15H19V12.999L21 13V11L19 10.999V9Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().addColumnAfter().run()
                }
            },
            {
                id: "insert-row-top",
                title: "insert-row-top",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 13C20.5523 13 21 13.4477 21 14V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V14C3 13.4477 3.44772 13 4 13H20ZM19 15H5V19H19V15ZM12 1C14.7614 1 17 3.23858 17 6C17 8.76142 14.7614 11 12 11C9.23858 11 7 8.76142 7 6C7 3.23858 9.23858 1 12 1ZM13 3H11V4.999L9 5V7L11 6.999V9H13V6.999L15 7V5L13 4.999V3Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().addRowBefore().run()
                }
            },
            {
                id: "insert-row-bottom",
                title: "insert-row-bottom",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M12 13C14.7614 13 17 15.2386 17 18C17 20.7614 14.7614 23 12 23C9.23858 23 7 20.7614 7 18C7 15.2386 9.23858 13 12 13ZM13 15H11V16.999L9 17V19L11 18.999V21H13V18.999L15 19V17L13 16.999V15ZM20 3C20.5523 3 21 3.44772 21 4V10C21 10.5523 20.5523 11 20 11H4C3.44772 11 3 10.5523 3 10V4C3 3.44772 3.44772 3 4 3H20ZM5 5V9H19V5H5Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().addRowAfter().run()
                }
            },
            {
                id: "delete-column",
                title: "delete-column",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M12 3C12.5523 3 13 3.44772 13 4L12.9998 11.9998C13.8355 11.372 14.8743 11 16 11C18.7614 11 21 13.2386 21 16C21 18.7614 18.7614 21 16 21C14.9681 21 14.0092 20.6874 13.2129 20.1518L13 20C13 20.5523 12.5523 21 12 21H6C5.44772 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3H12ZM11 5H7V19H11V5ZM19 15H13V17H19V15Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().deleteColumn().run()
                }
            },
            {
                id: "delete-row",
                title: "delete-row",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 5C20.5523 5 21 5.44772 21 6V12C21 12.5523 20.5523 13 20 13C20.628 13.8355 21 14.8743 21 16C21 18.7614 18.7614 21 16 21C13.2386 21 11 18.7614 11 16C11 14.8743 11.372 13.8355 11.9998 12.9998L4 13C3.44772 13 3 12.5523 3 12V6C3 5.44772 3.44772 5 4 5H20ZM13 15V17H19V15H13ZM19 7H5V11H19V7Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().deleteRow().run()
                }
            },
            {
                id: "merge-cells-horizontal",
                title: "merge-cells-horizontal",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20ZM11 5H5V10.999H7V9L10 12L7 15V13H5V19H11V17H13V19H19V13H17V15L14 12L17 9V10.999H19V5H13V7H11V5ZM13 13V15H11V13H13ZM13 9V11H11V9H13Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().mergeCells().run()
                }
            },
            {
                id: "merge-cells-vertical",
                title: "merge-cells-vertical",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V20ZM19 11V5H13.001V7H15L12 10L9 7H11V5H5V11H7V13H5V19H11V17H9L12 14L15 17H13.001V19H19V13H17V11H19ZM11 13H9V11H11V13ZM15 13H13V11H15V13Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().mergeCells().run()
                }
            },
            {
                id: "split-cells-horizontal",
                title: "split-cells-horizontal",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20ZM11 5H5V19H11V15H13V19H19V5H13V9H11V5ZM15 9L18 12L15 15V13H9V15L6 12L9 9V11H15V9Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().splitCell().run()
                }
            },
            {
                id: "split-cells-vertical",
                title: "split-cells-vertical",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"none\" d=\"M0 0h24v24H0z\"></path><path d=\"M20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20ZM19 5H5V10.999L9 11V13H5V19H19V13H15V11L19 10.999V5ZM12 6L15 9H13V15H15L12 18L9 15H11V9H9L12 6Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().splitCell().run()
                }
            },
            {
                id: "delete",
                title: "delete-table",
                icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z\"></path></svg>",
                onClick: ({innerEditor: editor}) => {
                    editor?.chain().focus().deleteTable().run()
                }
            },
            {
                id: "cell-background-color",
                title: "highlight",
                icon: `
                    <div class="table-bubble-menu colors-menu">
                        <div class="currentColor">
                            <div class="colors-menu-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.2427 4.51138L8.50547 11.2486L7.79836 13.3699L6.7574 14.4109L9.58583 17.2393L10.6268 16.1983L12.7481 15.4912L19.4853 8.75402L15.2427 4.51138ZM21.6066 8.04692C21.9972 8.43744 21.9972 9.0706 21.6066 9.46113L13.8285 17.2393L11.7071 17.9464L10.2929 19.3606C9.90241 19.7511 9.26925 19.7511 8.87872 19.3606L4.63608 15.118C4.24556 14.7275 4.24556 14.0943 4.63608 13.7038L6.0503 12.2896L6.7574 10.1682L14.5356 2.39006C14.9261 1.99954 15.5593 1.99954 15.9498 2.39006L21.6066 8.04692ZM15.2427 7.33981L16.6569 8.75402L11.7071 13.7038L10.2929 12.2896L15.2427 7.33981ZM4.28253 16.8858L7.11096 19.7142L5.69674 21.1284L1.4541 19.7142L4.28253 16.8858Z"></path></svg>
                            </div>
                            <style>
                            </style>
                            <div class="colors-menu-status" id="cellBgColorStatus"></div>
                        </div>
                        <div id="dropdown">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 14L8 10H16L12 14Z"></path></svg>
                        </div>
                    </div>
                `.trim(),
                onInit: (_editor, _tippyInstance, menu) => {
                    const lastUsedColor = TableCellBackgroundColor.getLastUsedColor() || '';
                    const statusElement = menu.querySelector('#cellBgColorStatus') as HTMLElement;
                    if (statusElement) {
                        statusElement.style.backgroundColor = lastUsedColor;
                    }
                },
                onClick: ({innerEditor: editor}, _tippyInstance, menu, _holder) => {
                    const e = window.event as MouseEvent;
                    const target = e.target as HTMLElement;

                    const menuItem = menu.querySelector('#cell-background-color');

                    // 检查点击的是哪个元素
                    // 查找最近的匹配选择器的父元素
                    const isDropdown = target.closest('#dropdown');
                    const isColorIcon = target.closest('.colors-menu-icon');

                    if (isDropdown) {
                        // 点击的是下拉箭头，显示颜色选择器
                        const colorPicker = new TableCellBackgroundColor();
                        colorPicker.editor = editor;

                        // 创建颜色选择器元素
                        const colorPickerElement = colorPicker.createColorPicker();

                        // 使用tippy显示颜色选择器
                        const instance = tippy(menuItem as HTMLElement, {
                            content: colorPickerElement,
                            placement: 'bottom',
                            trigger: 'manual',
                            arrow: false,
                            interactive: true,
                            appendTo: editor.aiEditor.container,
                            onHide() {
                                setTimeout(() => {
                                    instance.destroy();
                                }, 0);
                            }
                        });
                        colorPicker.onClose = (color) => {
                            instance.hide();
                            const statusElement = menu.querySelector('#cellBgColorStatus') as HTMLElement;
                            if (statusElement) {
                                statusElement.style.backgroundColor = color || '';
                            }
                        };
                        instance.show();
                    } else if (isColorIcon) {
                        const currentColor = TableCellBackgroundColor.getLastUsedColor();
                        editor?.chain().setCellAttribute('backgroundColor', currentColor).run();
                    }
                }
            }
        ]
    }

    onCreate(createEvent: EditorEvents["create"], _: AiEditorOptions) {
        super.onCreate(createEvent, _);
        this.activeOnClick = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.checkSelectionAndShow(this.editor!);
    }

    onTransaction(event: EditorEvents["transaction"]) {
        this.checkSelectionAndShow(event.editor);
    }

    checkSelectionAndShow(editor: Editor) {
        const {state: {selection}, view} = editor;
        if (selection instanceof CellSelection) {
            if (this.isAllTableSelected(selection)) {
                this.showItems(["delete"])
            } else if (this.isOneCellSelected(selection)) {
                const showIds = [
                    "insert-column-left", "insert-column-right", "delete-column",
                    "insert-row-top", "insert-row-bottom", "delete-row",
                    "cell-background-color" // 新增背景色按钮
                ];
                if (editor.can().splitCell()) {
                    const nodeDOM = view.nodeDOM(selection.$anchorCell.pos) as HTMLTableRowElement;
                    const colspan = nodeDOM.getAttribute("colspan");
                    const rowspan = nodeDOM.getAttribute("rowspan");
                    if (colspan && Number(colspan) > 1) {
                        showIds.push("split-cells-horizontal")
                    } else if (rowspan && Number(rowspan) > 1) {
                        showIds.push("split-cells-vertical")
                    }
                }
                this.showItems(showIds)
            } else if (this.isColumnSelected(selection, view)) {
                this.showItems([
                    "insert-column-left", "insert-column-right", "delete-column",
                    "merge-cells-vertical", "cell-background-color" // 新增
                ])
            } else if (this.isRowSelected(selection, view)) {
                this.showItems([
                    "insert-row-top", "insert-row-bottom", "delete-row",
                    "merge-cells-horizontal", "cell-background-color" // 新增
                ])
            } else {
                this.showItems(["merge-cells-horizontal", "cell-background-color"]) // 新增
            }
        } else {
            this.showItems([
                "insert-column-left", "insert-column-right", "delete-column",
                "insert-row-top", "insert-row-bottom", "delete-row",
                "cell-background-color" // 新增
            ])
        }
    }


    showItems(ids: string[]) {
        this.querySelectorAll(".aie-bubble-menu-item").forEach((el) => {
            (el as HTMLElement).style.display = "none";
        })

        ids.forEach((id) => {
            const div = this.querySelector(`#${id}`) as HTMLElement;
            if (div) div.style.display = "";
        })
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



