import {Extension, Extensions, getTextBetween, posToDOMRect} from "@tiptap/core";
import {AiEditor} from "./AiEditor.ts";
import {BubbleMenuOptions, BubbleMenuPlugin} from "../components/bubbles/BubbleMenuPlugin.ts";

import {LinkBubbleMenu} from "../components/bubbles/LinkBubbleMenu.ts";
import {AbstractBubbleMenu} from "../components/AbstractBubbleMenu.ts";
import {ImageBubbleMenu} from "../components/bubbles/ImageBubbleMenu.ts";
import {TableBubbleMenu} from "../components/bubbles/TableBubbleMenu.ts";
import {TextSelectionBubbleMenu} from "../components/bubbles/TextSelectionBubbleMenu.ts";
import {Instance} from "tippy.js";
import {defineCustomElement} from "../commons/defineCustomElement.ts";
import {CellSelection} from "@tiptap/pm/tables";

defineCustomElement('aie-bubble-link', LinkBubbleMenu);
defineCustomElement('aie-bubble-image', ImageBubbleMenu);
defineCustomElement('aie-bubble-table', TableBubbleMenu);
defineCustomElement('aie-bubble-text', TextSelectionBubbleMenu);


function createBubbleMenu(name: string, options: BubbleMenuOptions) {
    return Extension.create<BubbleMenuOptions>({
        name: name,
        addOptions() {
            return {
                ...options
            }
        },
        addProseMirrorPlugins() {
            if (!this.options.element) {
                return []
            }

            return [
                BubbleMenuPlugin({
                    pluginKey: this.options.pluginKey,
                    editor: this.editor,
                    element: this.options.element,
                    tippyOptions: this.options.tippyOptions,
                    updateDelay: this.options.updateDelay,
                    shouldShow: this.options.shouldShow,
                    updateAtMouseUp: this.options.updateAtMouseUp,
                }),
            ]
        },
    })
}


const createTextSelectionBubbleMenu = (aiEditor: AiEditor) => {
    const elementTagName = aiEditor.options.textSelectionBubbleMenu?.elementTagName || "aie-bubble-text";
    const menuEl = document.createElement(elementTagName) as TextSelectionBubbleMenu;
    aiEditor.eventComponents.push(menuEl);

    return createBubbleMenu("textSelectionBubble", {
        pluginKey: 'textSelectionBubble',
        element: menuEl,
        updateDelay: 0,
        updateAtMouseUp: true,
        tippyOptions: {
            appendTo: aiEditor.container,
            arrow: false,
            placement: 'bottom',
            getReferenceClientRect: (() => {
                const {view, state} = aiEditor.innerEditor;
                const {head, from, to} = state.selection;
                if (from == 1 && to == state.doc.content.size - 1) {
                    const selectRect = posToDOMRect(view, from, to);
                    const editorRect = view.dom.getBoundingClientRect();

                    const bottom = selectRect.bottom > editorRect.bottom ? editorRect.bottom : selectRect.bottom;
                    const height = selectRect.height > editorRect.height ? editorRect.height / 2 : selectRect.height;
                    const top = selectRect.top < editorRect.top ? editorRect.top : selectRect.top;

                    return {
                        ...selectRect,
                        top,
                        height,
                        bottom,
                    };
                } else {
                    const headRect = posToDOMRect(view, head, head);
                    return {
                        ...headRect,
                        height: headRect.height - 10
                    }
                }
            }),
            onCreate(instance: Instance) {
                menuEl.instance = instance;
            }
        },
        shouldShow: ({editor}) => {
            if (!editor.isEditable) {
                return false;
            }
            const {state: {selection}} = editor;
            return !selection.empty && getTextBetween(editor.state.doc, {
                    from: selection.from,
                    to: selection.to
                }).trim().length > 0
                && !editor.isActive("link")
                && !editor.isActive("image")
                // 选中表格的时候取消 文本的弹出
                && !(selection instanceof CellSelection)
        }
    })
}


const createLinkBubbleMenu = (aiEditor: AiEditor) => {
    const menuEl = document.createElement("aie-bubble-link") as AbstractBubbleMenu;
    aiEditor.eventComponents.push(menuEl);
    return createBubbleMenu("linkBubble", {
        pluginKey: 'textSelectionBubble',
        element: menuEl,
        tippyOptions: {
            appendTo: aiEditor.container,
            placement: 'bottom',
            arrow: false,
            onCreate(instance: Instance) {
                menuEl.instance = instance;
            },
        },
        shouldShow: ({editor}) => {
            return editor.isEditable && editor.isActive("link")
        }
    })
}


const createImageBubbleMenu = (aiEditor: AiEditor) => {
    const menuEl = document.createElement("aie-bubble-image") as AbstractBubbleMenu;
    aiEditor.eventComponents.push(menuEl);
    return createBubbleMenu("imageBubble", {
        pluginKey: 'imageBubble',
        element: menuEl,
        tippyOptions: {
            appendTo: aiEditor.container,
            placement: 'top-start',
            arrow: false,
            getReferenceClientRect: (() => {
                const {ranges} = aiEditor.innerEditor.state.selection
                const from = Math.min(...ranges.map(range => range.$from.pos))
                const to = Math.max(...ranges.map(range => range.$to.pos))
                const {view} = aiEditor.innerEditor;

                let node = view.nodeDOM(from) as HTMLElement
                const imageEl = node.querySelector("img") as HTMLImageElement;

                const domRect = posToDOMRect(view, from, to);
                const imgRect = imageEl.getBoundingClientRect();
                return {
                    ...domRect,
                    left: imgRect.left + imgRect.width * 0.5 - 100
                }
            }),
            onCreate(instance: Instance) {
                menuEl.instance = instance;
            },
        },
        shouldShow: ({editor}) => {
            return editor.isEditable && editor.isActive("image")
        }
    })
}


const createTableBubbleMenu = (aiEditor: AiEditor) => {
    const menuEl = document.createElement("aie-bubble-table") as AbstractBubbleMenu;
    aiEditor.eventComponents.push(menuEl);
    return createBubbleMenu("tableBubble", {
        pluginKey: 'tableBubble',
        element: menuEl,
        tippyOptions: {
            placement: 'top',
            appendTo: aiEditor.container,
            arrow: false,
            getReferenceClientRect: (() => {
                const selection = aiEditor.innerEditor.state.selection;
                const {ranges} = selection
                const from = Math.min(...ranges.map(range => range.$from.pos))
                const to = Math.max(...ranges.map(range => range.$to.pos))
                const {view, state} = aiEditor.innerEditor;

                const domRect = posToDOMRect(view, from, to);
                const tablePos = state.selection.$from.posAtIndex(0, 1);
                const coordsAtPos = view.coordsAtPos(tablePos);

                return {
                    ...domRect,
                    top: coordsAtPos.top
                };
            })
        },
        shouldShow: ({editor}) => {
            const {state: {selection}} = editor;
            return editor.isEditable && editor.isActive("table") && selection instanceof CellSelection
        }
    })
}


export const getBubbleMenus = (aiEditor: AiEditor): Extensions => {
    const bubbleMenus: Extensions = [];
    if (aiEditor.options.editable === false) {
        return bubbleMenus;
    }

    const textSelectionEnable = !(aiEditor?.options.textSelectionBubbleMenu?.enable === false)
    if (textSelectionEnable) {
        bubbleMenus.push(createTextSelectionBubbleMenu(aiEditor))
    }

    bubbleMenus.push(createLinkBubbleMenu(aiEditor))
    bubbleMenus.push(createImageBubbleMenu(aiEditor))
    bubbleMenus.push(createTableBubbleMenu(aiEditor))
    return bubbleMenus;
}
