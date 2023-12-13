import {Extension, Extensions, posToDOMRect} from "@tiptap/core";
import {AiEditor} from "./AiEditor.ts";
import {BubbleMenuOptions, BubbleMenuPlugin} from "@tiptap/extension-bubble-menu";


import {LinkBubbleMenu} from "../components/bubbles/LinkBubbleMenu.ts";
import {AbstractBubbleMenu} from "../components/AbstractBubbleMenu.ts";
import {ImageBubbleMenu} from "../components/bubbles/ImageBubbleMenu.ts";
import {TableBubbleMenu} from "../components/bubbles/TableBubbleMenu.ts";
import {TextSelectionBubbleMenu} from "../components/bubbles/TextSelectionBubbleMenu.ts";

window.customElements.define('aie-bubble-link', LinkBubbleMenu);
window.customElements.define('aie-bubble-image', ImageBubbleMenu);
window.customElements.define('aie-bubble-table', TableBubbleMenu);
window.customElements.define('aie-bubble-text', TextSelectionBubbleMenu);


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
                }),
            ]
        },
    })
}


const createTextSelectionBubbleMenu = (aiEditor: AiEditor) => {
    const menuEl = document.createElement("aie-bubble-text") as AbstractBubbleMenu;
    aiEditor.eventComponents.push(menuEl);
    return createBubbleMenu("textSelectionBubble", {
        pluginKey: 'textSelectionBubble',
        element: menuEl,
        tippyOptions: {
            appendTo: aiEditor.container,
            placement: 'top',
            arrow: false,
        },
        // shouldShow: ({editor}) => {
        //     return editor.isActive("link")
        // }
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
        },
        shouldShow: ({editor}) => {
            return editor.isActive("link")
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
                const view = aiEditor.innerEditor.view;

                let node = view.nodeDOM(from) as HTMLElement
                const imageEl = node.querySelector("img") as HTMLImageElement;

                const domRect = posToDOMRect(view, from, to);
                const imgRect = imageEl.getBoundingClientRect();
                return {
                    ...domRect,
                    left: imgRect.left + imgRect.width * 0.25
                }
            })
        },
        shouldShow: ({editor}) => {
            return editor.isActive("image")
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
                const view = aiEditor.innerEditor.view;

                const domRect = posToDOMRect(view, from, to);
                const tablePos = aiEditor.innerEditor.state.selection.$from.posAtIndex(0, 1);
                const coordsAtPos = aiEditor.innerEditor.view.coordsAtPos(tablePos);

                return {
                    ...domRect,
                    top: coordsAtPos.top
                };
            })
        },
        shouldShow: ({editor}) => {
            return editor.isActive("table")
        }
    })
}


export const getBubbleMenus = (aiEditor: AiEditor): Extensions => {
    const bubbleMenus: Extensions = [];
    bubbleMenus.push(createTextSelectionBubbleMenu(aiEditor))
    bubbleMenus.push(createLinkBubbleMenu(aiEditor))
    bubbleMenus.push(createImageBubbleMenu(aiEditor))
    bubbleMenus.push(createTableBubbleMenu(aiEditor))
    return bubbleMenus;
}
