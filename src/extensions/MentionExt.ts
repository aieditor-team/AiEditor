import {Mention} from "@tiptap/extension-mention";
import tippy, {Instance} from "tippy.js";
import {SuggestionProps} from "@tiptap/suggestion";

export const createMention = (onMentionLoad: (query: string) => any[] | Promise<any[]>) => {
    return Mention.configure({
        HTMLAttributes: {
            class: 'mention',
        },
        suggestion: {
            items: ({query}) => {
              return onMentionLoad(query)
            },

            render: () => {
                let element: HTMLDivElement;
                let popup: Instance[];
                let selectIndex: number = 0;
                let suggestionProps: SuggestionProps;

                return {
                    onStart: (props: SuggestionProps) => {

                        element = document.createElement("div") as HTMLDivElement;
                        element.style.width = "200px"
                        element.style.height = "200px"
                        element.style.border = "solid 1px #ccc"
                        element.style.background = "antiquewhite"

                        element.innerHTML = `
                            <div className="items">
                             ${props.items.map((item: any) => {
                                    return `<button>${item}</button>`
                                }).join("")}
                            </div>
                            `

                        console.log("onStart: ", props)
                        if (!props.clientRect) {
                            return
                        }

                        // @ts-ignore
                        popup = tippy('body', {
                            getReferenceClientRect: props.clientRect,
                            appendTo: () => document.body,
                            content: element,
                            showOnCreate: true,
                            interactive: true,
                            allowHTML: true,
                            trigger: 'manual',
                            placement: 'bottom-start',
                        })

                        suggestionProps = props;
                    },

                    onUpdate(props) {
                        suggestionProps = props;

                        element.innerHTML = `
                            <div className="items">
                             ${props.items.map((item: any) => {
                                    return `<button>${item}</button>`
                                }).join("")}
                            </div>
                            `

                        if (!props.clientRect) {
                            return
                        }

                        popup[0].setProps({
                            getReferenceClientRect: props.clientRect as any,
                        })
                    },

                    onKeyDown(props) {
                        if (props.event.key === 'Escape') {
                            popup[0].hide();
                            return true;
                        } else if (props.event.key === "ArrowUp") {
                            selectIndex = (selectIndex + suggestionProps.items.length - 1) % suggestionProps.items.length
                            return true;
                        } else if (props.event.key === "ArrowDown") {
                            selectIndex = (selectIndex + 1) % suggestionProps.items.length
                            return true;
                        } else if (props.event.key === "Enter") {
                            const item = suggestionProps.items[selectIndex];
                            if (item) suggestionProps.command({id: item})
                            return true;
                        }
                        return false;
                    },

                    onExit() {
                        popup[0].destroy()
                        element.remove();
                    },
                }
            },
        }
    })
}
