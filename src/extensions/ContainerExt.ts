import {Node, mergeAttributes, wrappingInputRule} from '@tiptap/core';
import {createElement} from '../util/htmlUtil';
import tippy, {Instance} from "tippy.js";
import {t} from "i18next";


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        container: {
            setContainer: (type: string) => ReturnType,
            toggleContainer: (type: string) => ReturnType,
            unsetContainer: () => ReturnType,
        };
    }
}


export const defaultItems = ['info', 'warning', 'danger']


export interface ContainerOptions {
    HTMLAttributes: {
        [key: string]: any
    },
    typeItems: string[],
    defaultType?: string | null,
}

export const containerInputRegex = /^:::([a-z]+)?[\s\n]$/

export const ContainerExt = Node.create<ContainerOptions>({
    name: 'container',
    group: 'block',
    content: 'block+',
    defining: true,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'container-wrapper',
            },
            typeItems: defaultItems,
            defaultType: null,
        }
    },


    addAttributes() {
        return {
            containerClass: {
                default: this.options.defaultType,
                parseHTML: element => {
                    for (let clazz of element.classList) {
                        if (clazz != 'container-wrapper') {
                            return clazz;
                        }
                    }
                },
                renderHTML: attributes => ({
                    'class': attributes.containerClass,
                }),
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div.container-wrapper',
            },
        ]
    },


    renderHTML({HTMLAttributes}) {
        const attrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
        return ['div', attrs, 0]
    },


    addCommands() {
        return {
            setContainer: type => ({commands}) => {
                if (!type) type = this.options.defaultType!
                return commands.wrapIn(this.name, {containerClass: type})
            },
            toggleContainer: type => ({commands}) => {
                if (!type) type = this.options.defaultType!
                return commands.toggleWrap(this.name, {containerClass: type})
            },
            unsetContainer: () => ({commands}) => {
                return commands.lift(this.name)
            },
        }
    },

    addInputRules() {
        return [
            wrappingInputRule({
                find: containerInputRegex,
                type: this.type,
                getAttributes: match => {
                    return {
                        containerClass: match[1],
                    }
                },
            }),
        ]
    },

    addNodeView() {
        return ({node, editor}) => {
            const div = document.createElement('div')
            div.classList.add('container-wrapper')
            div.classList.add(node.attrs.containerClass)

            let contentDOM = div;
            let tippyInstance: Instance | null = null;

            if (editor.isEditable) {
                div.style.position = "relative"
                div.appendChild(createElement(`<div class="aie-container-tools">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C17.5222 2 22 5.97778 22 10.8889C22 13.9556 19.5111 16.4444 16.4444 16.4444H14.4778C13.5556 16.4444 12.8111 17.1889 12.8111 18.1111C12.8111 18.5333 12.9778 18.9222 13.2333 19.2111C13.5 19.5111 13.6667 19.9 13.6667 20.3333C13.6667 21.2556 12.9 22 12 22C6.47778 22 2 17.5222 2 12C2 6.47778 6.47778 2 12 2ZM10.8111 18.1111C10.8111 16.0843 12.451 14.4444 14.4778 14.4444H16.4444C18.4065 14.4444 20 12.851 20 10.8889C20 7.1392 16.4677 4 12 4C7.58235 4 4 7.58235 4 12C4 16.19 7.2226 19.6285 11.324 19.9718C10.9948 19.4168 10.8111 18.7761 10.8111 18.1111ZM7.5 12C6.67157 12 6 11.3284 6 10.5C6 9.67157 6.67157 9 7.5 9C8.32843 9 9 9.67157 9 10.5C9 11.3284 8.32843 12 7.5 12ZM16.5 12C15.6716 12 15 11.3284 15 10.5C15 9.67157 15.6716 9 16.5 9C17.3284 9 18 9.67157 18 10.5C18 11.3284 17.3284 12 16.5 12ZM12 9C11.1716 9 10.5 8.32843 10.5 7.5C10.5 6.67157 11.1716 6 12 6C12.8284 6 13.5 6.67157 13.5 7.5C13.5 8.32843 12.8284 9 12 9Z"></path></svg>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14L8 10H16L12 14Z"></path></svg>
</div>`))
                contentDOM = createElement(`<div></div>`) as HTMLDivElement;
                div.appendChild(contentDOM)

                const createEL = () => {
                    const el = createElement(`<div>
<div class="aie-container-tools-body">
    <div>${t('type')}</div>
    <div class="aie-container-tools-body-color-items">${this.options.typeItems.map(item => {
                        return `<div class="aie-container-tools-body-color-box ${item}" title="${item}"></div>`
                    }).join("")}</div>
</div>`)
                    el.addEventListener("click", (e) => {
                        if (e.target instanceof HTMLElement && e.target.classList.contains("aie-container-tools-body-color-box")) {
                            editor.commands.updateAttributes(this.name, {
                                containerClass: e.target.getAttribute("title")
                            })
                        }
                    })
                    return el;
                }


                tippyInstance = tippy(div.querySelector(".aie-container-tools")!, {
                    content: createEL(),
                    appendTo: () => div.closest(".aie-container")!,
                    placement: 'bottom-end',
                    trigger: 'click',
                    interactive: true,
                    arrow: false,
                    offset: [8, 0],
                    aria: {
                        content: null,
                        expanded: false,
                    },
                });
            }

            return {
                dom: div,
                contentDOM: contentDOM,
                destroy() {
                    tippyInstance?.destroy();
                },
            }
        }
    }

});
