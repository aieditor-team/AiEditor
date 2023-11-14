import {Extension} from '@tiptap/core'

import Suggestion, {SuggestionOptions, SuggestionProps} from '@tiptap/suggestion'


import tippy, {Instance} from "tippy.js";
import {AiModelFactory} from "../ai/AiModelFactory.ts";
import {AiCommand, AiEditorOptions, InnerEditor} from "../core/AiEditor.ts";

export type AiCommandOptions = {
    HTMLAttributes?: Record<string, any>
    suggestion: Omit<SuggestionOptions, 'editor'>
    editorOptions: AiEditorOptions
}

export const defaultCommands = [
    {
        name: "AI 续写",
        prompt: "请帮我继续扩展一些这段话的内容",
        model: "xinghuo",
    },
    {
        name: "AI 提问",
        prompt: "",
        model: "xinghuo",
    },
    {
        name: "AI 翻译",
        prompt: "请帮我把这段内容翻译为英语，直接返回英语结果",
        model: "xinghuo",
    },
    {
        name: "AI 生图",
        prompt: "请根据以上的内容，生成一张图片，并把图片返回给我",
        model: "xinghuo",
    },
] as AiCommand[];

export const AiCommandExt = Extension.create<AiCommandOptions>({
    name: 'aiCommand',
    // @ts-ignore
    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({editor, range, props}) => {
                    editor.chain().focus().deleteRange(range).run();
                    let aiCommand = props as AiCommand;
                    const selectedText = editor.state.selection.$head.parent.textContent;
                    const userOptions = (editor as InnerEditor).userOptions;
                    const aiModel = AiModelFactory.create(aiCommand.model, userOptions);
                    if (aiModel) {
                        aiModel?.start(selectedText, aiCommand.prompt, editor);
                    } else {
                        console.error("Ai model config error.")
                    }
                },

                render: () => {
                    let element: HTMLDivElement;
                    let popup: Instance[];
                    let selectIndex: number = 0;
                    let suggestionProps: SuggestionProps;
                    const updateElement = () => {
                        element.innerHTML = `
                            <div class="items">
                             ${suggestionProps.items.map((item: AiCommand, index) => {
                            return `<button class="item ${index === selectIndex ? 'item-selected' : ''}" data-index="${index}">${item.name}</button>`
                        }).join("")}
                            </div>
                            `
                        element.addEventListener("click",(e)=>{
                            const closest = (e.target as HTMLElement).closest(".item");
                            if (closest){
                                const selectIndex = Number(closest.getAttribute("data-index"));
                                const item = suggestionProps.items[selectIndex];
                                if (item) suggestionProps.command(item)
                            }
                        })
                    }

                    return {
                        onStart: (props: SuggestionProps) => {

                            element = document.createElement("div") as HTMLDivElement;
                            element.classList.add("suggestion")
                            suggestionProps = props;

                            if (!props.clientRect) {
                                return
                            }

                            updateElement();

                            // @ts-ignore
                            popup = tippy('body', {
                                getReferenceClientRect: props.clientRect,
                                appendTo: () => props.editor.view.dom.closest(".aie-container"),
                                content: element,
                                showOnCreate: true,
                                interactive: true,
                                allowHTML: true,
                                trigger: 'manual',
                                placement: 'right-start',
                                arrow: false,
                            })
                        },

                        onUpdate(props) {
                            suggestionProps = props;

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
                                updateElement();
                                return true;
                            } else if (props.event.key === "ArrowDown") {
                                selectIndex = (selectIndex + 1) % suggestionProps.items.length
                                updateElement();
                                return true;
                            } else if (props.event.key === "Enter") {
                                const item = suggestionProps.items[selectIndex];
                                if (item) suggestionProps.command(item)
                                return true;
                            }
                            return false;
                        },

                        onExit() {
                            popup[0].destroy()
                            element.remove()
                        },
                    }
                }
            },
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ]
    },
})