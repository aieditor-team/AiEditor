import {Node, mergeAttributes} from '@tiptap/core';
// @ts-ignore
import markdownitContainer from "markdown-it-container";

export interface ContainerOptions {
    classes: string[],
    HTMLAttributes: {
        [key: string]: any
    },
}

export const ContainerExt = Node.create<ContainerOptions>({
    name: 'container',
    group: 'block',
    content: 'block+',
    defining: true,

    addOptions() {
        return {
            classes: ['info', 'warning', 'danger'],
            HTMLAttributes: {
                class: 'container-wrapper',
            },
        }
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: any, node: any) {
                    state.write("::: " + (node.attrs.containerClass || "") + "\n");
                    state.renderContent(node);
                    state.flushClose(1);
                    state.write(":::");
                    state.closeBlock(node);
                },
                parse: {
                    setup: (markdownit: any) => {
                        this.options.classes.forEach(className => {
                            markdownit.use(markdownitContainer, className);
                        });
                    },
                }
            }
        }
    },

    addAttributes() {
        return {
            containerClass: {
                default: null,
                parseHTML: element => [...element.classList].find(className => this.options.classes.includes(className)),
                renderHTML: attributes => ({
                    'class': attributes.containerClass,
                }),
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div',
                getAttrs: element => {
                    const el = element as HTMLElement;
                    const classes = ["container-wrapper"].concat(this.options.classes);
                    return [...el.classList].find(className => classes.includes(className)) ? null : false
                },
            },
        ]
    },

    renderHTML({HTMLAttributes}) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    },
});