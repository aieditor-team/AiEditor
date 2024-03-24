import {Extension} from '@tiptap/core'

import Suggestion, {SuggestionOptions, SuggestionProps} from '@tiptap/suggestion'


import tippy, {Instance} from "tippy.js";
import {AiModelManager} from "../ai/AiModelManager.ts";
import {AiEditorOptions} from "../core/AiEditor.ts";
import {DefaultAiMessageListener} from "../ai/core/DefaultAiMessageListener.ts";
import {AiMenu} from "../ai/AiGlobalConfig.ts";

export type AiCommandOptions = {
    HTMLAttributes?: Record<string, any>
    suggestion: Omit<SuggestionOptions, 'editor'>
    editorOptions: AiEditorOptions
}

export const defaultCommands = [
    {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 19V21H19V19H21ZM17 19V21H15V19H17ZM13 19V21H11V19H13ZM9 19V21H7V19H9ZM5 19V21H3V19H5ZM21 15V17H19V15H21ZM5 15V17H3V15H5ZM5 11V13H3V11H5ZM16 3C18.6874 3 20.8817 5.12366 20.9954 7.78322L21 8V13H19V8C19 6.40893 17.7447 5.09681 16.1756 5.00512L16 5H11V3H16ZM5 7V9H3V7H5ZM5 3V5H3V3H5ZM9 3V5H7V3H9Z" fill="currentColor"></path></svg>',
        name: "AI 续写",
        prompt: "请帮我继续扩展一些这段话的内容",
        model: "auto",
    },
    {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15 5.25C16.7949 5.25 18.25 3.79493 18.25 2H19.75C19.75 3.79493 21.2051 5.25 23 5.25V6.75C21.2051 6.75 19.75 8.20507 19.75 10H18.25C18.25 8.20507 16.7949 6.75 15 6.75V5.25ZM4 7C4 5.89543 4.89543 5 6 5H13V3H6C3.79086 3 2 4.79086 2 7V17C2 19.2091 3.79086 21 6 21H18C20.2091 21 22 19.2091 22 17V12H20V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z" fill="currentColor"></path></svg>',
        name: "AI 提问",
        prompt: "",
        model: "auto",
    },
    {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 15V17C5 18.0544 5.81588 18.9182 6.85074 18.9945L7 19H10V21H7C4.79086 21 3 19.2091 3 17V15H5ZM18 10L22.4 21H20.245L19.044 18H14.954L13.755 21H11.601L16 10H18ZM17 12.8852L15.753 16H18.245L17 12.8852ZM8 2V4H12V11H8V14H6V11H2V4H6V2H8ZM17 3C19.2091 3 21 4.79086 21 7V9H19V7C19 5.89543 18.1046 5 17 5H14V3H17ZM6 6H4V9H6V6ZM10 6H8V9H10V6Z" fill="currentColor"></path></svg>',
        name: "AI 翻译",
        prompt: "请帮我翻译以上内容，在翻译之前，想先判断一下这个内容是不是中文，如果是中文，则翻译问英文，如果是其他语言，则需要翻译为中文，注意，你只需要返回翻译的结果，不需要对此进行任何解释，不需要除了翻译结果以外的其他任何内容。",
        model: "auto",
    },
    {
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 3C20.5523 3 21 3.44772 21 4V5.757L19 7.757V5H5V13.1L9 9.1005L13.328 13.429L11.9132 14.8422L9 11.9289L5 15.928V19H15.533L16.2414 19.0012L17.57 17.671L18.8995 19H19V16.242L21 14.242V20C21 20.5523 20.5523 21 20 21H4C3.45 21 3 20.55 3 20V4C3 3.44772 3.44772 3 4 3H20ZM21.7782 7.80761L23.1924 9.22183L15.4142 17L13.9979 16.9979L14 15.5858L21.7782 7.80761ZM15.5 7C16.3284 7 17 7.67157 17 8.5C17 9.32843 16.3284 10 15.5 10C14.6716 10 14 9.32843 14 8.5C14 7.67157 14.6716 7 15.5 7Z" fill="currentColor"></path></svg>',
        name: "AI 生图",
        prompt: "请根据以上的内容，生成一张图片，并把图片返回给我",
        model: "auto",
    },
] as AiMenu[];

export const AiCommandExt = Extension.create<AiCommandOptions>({
    name: 'aiCommand',
    // @ts-ignore
    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({editor, range, props}) => {
                    editor.chain().focus().deleteRange(range).run();

                    if (props && props.aiItem) {
                        let aiCommand = props.aiItem as AiMenu;
                        const selectedText = editor.state.selection.$head.parent.textContent;

                        let useModelType = aiCommand.model!;
                        const aiModel = AiModelManager.get(aiCommand.model!);
                        if (aiModel) {
                            aiModel?.chat(selectedText, aiCommand.prompt!, new DefaultAiMessageListener(editor));
                        } else {
                            console.error("Ai model config error. can not find the type:" + useModelType + " at command menu")
                        }
                    } else {
                        switch (props.index) {
                            case 0:
                                editor.chain().setParagraph().run()
                                return;
                            case 1:
                                editor!.chain().setHeading({level: 1}).run();
                                return;
                            case 2:
                                editor!.chain().setHeading({level: 2}).run();
                                return;
                            case 3:
                                editor!.chain().setHeading({level: 3}).run();
                                return;
                            case 4:
                                editor!.chain().toggleContainer("warning").run();
                                return;
                            case 5:
                                editor!.chain().toggleBlockquote().run();
                                return;
                            case 6:
                                editor!.chain().toggleBulletList().run();
                                return;
                            case 7:
                                editor!.chain().toggleOrderedList().run();
                                return;
                            case 8:
                                editor!.chain().setTextAlign("left").run()
                                return;
                            case 9:
                                editor!.chain().setTextAlign("center").run()
                                return;
                            case 10:
                                editor!.chain().toggleTaskList().run();
                                return;
                            case 11:
                                editor!.chain().toggleCodeBlock().run();
                                return;
                        }
                    }
                },

                render: () => {
                    let element: HTMLDivElement;
                    let popup: Instance[];
                    let selectIndex: number = 0;
                    let suggestionProps: SuggestionProps;
                    const updateElement = () => {
                        element.innerHTML = `
                            <div class="ai-command-container">
                                <div class="ai-command-container-header">
                                    <div class="ai-command-container-header-item item ${selectIndex === 0 ? 'active' : ''}" data-index="0">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 6V21H11V6H5V4H19V6H13Z" fill="currentColor"></path></svg>        
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 1 ? 'active' : ''}" data-index="1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 20H11V13H4V20H2V4H4V11H11V4H13V20ZM21.0005 8V20H19.0005L19 10.204L17 10.74V8.67L19.5005 8H21.0005Z" fill="currentColor"></path></svg>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 2 ? 'active' : ''}" data-index="2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4V11H11V4H13V20H11V13H4V20H2V4H4ZM18.5 8C20.5711 8 22.25 9.67893 22.25 11.75C22.25 12.6074 21.9623 13.3976 21.4781 14.0292L21.3302 14.2102L18.0343 18H22V20H15L14.9993 18.444L19.8207 12.8981C20.0881 12.5908 20.25 12.1893 20.25 11.75C20.25 10.7835 19.4665 10 18.5 10C17.5818 10 16.8288 10.7071 16.7558 11.6065L16.75 11.75H14.75C14.75 9.67893 16.4289 8 18.5 8Z" fill="currentColor"></path></svg>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 3 ? 'active' : ''}" data-index="3">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 8L21.9984 10L19.4934 12.883C21.0823 13.3184 22.25 14.7728 22.25 16.5C22.25 18.5711 20.5711 20.25 18.5 20.25C16.674 20.25 15.1528 18.9449 14.8184 17.2166L16.7821 16.8352C16.9384 17.6413 17.6481 18.25 18.5 18.25C19.4665 18.25 20.25 17.4665 20.25 16.5C20.25 15.5335 19.4665 14.75 18.5 14.75C18.214 14.75 17.944 14.8186 17.7056 14.9403L16.3992 13.3932L19.3484 10H15V8H22ZM4 4V11H11V4H13V20H11V13H4V20H2V4H4Z" fill="currentColor"></path></svg>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 4 ? 'active' : ''}" data-index="4">
                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 5H4V19H20V5ZM18 15V17H6V15H18Z"></path></svg>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 5 ? 'active' : ''}" data-index="5">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4.58341 17.3211C3.55316 16.2274 3 15 3 13.0103C3 9.51086 5.45651 6.37366 9.03059 4.82318L9.92328 6.20079C6.58804 8.00539 5.93618 10.346 5.67564 11.822C6.21263 11.5443 6.91558 11.4466 7.60471 11.5105C9.40908 11.6778 10.8312 13.159 10.8312 15C10.8312 16.933 9.26416 18.5 7.33116 18.5C6.2581 18.5 5.23196 18.0095 4.58341 17.3211ZM14.5834 17.3211C13.5532 16.2274 13 15 13 13.0103C13 9.51086 15.4565 6.37366 19.0306 4.82318L19.9233 6.20079C16.588 8.00539 15.9362 10.346 15.6756 11.822C16.2126 11.5443 16.9156 11.4466 17.6047 11.5105C19.4091 11.6778 20.8312 13.159 20.8312 15C20.8312 16.933 19.2642 18.5 17.3312 18.5C16.2581 18.5 15.232 18.0095 14.5834 17.3211Z" fill="currentColor"></path></svg>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 6 ? 'active' : ''}" data-index="6">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 4H21V6H8V4ZM3 3.5H6V6.5H3V3.5ZM3 10.5H6V13.5H3V10.5ZM3 17.5H6V20.5H3V17.5ZM8 11H21V13H8V11ZM8 18H21V20H8V18Z" fill="currentColor"></path></svg>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 7 ? 'active' : ''}" data-index="7">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 4H21V6H8V4ZM5 3V6H6V7H3V6H4V4H3V3H5ZM3 14V11.5H5V11H3V10H6V12.5H4V13H6V14H3ZM5 19.5H3V18.5H5V18H3V17H6V21H3V20H5V19.5ZM8 11H21V13H8V11ZM8 18H21V20H8V18Z" fill="currentColor"></path></svg>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 8 ? 'active' : ''}" data-index="8">
                                    <div style="width:18px;height: 18px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 4H21V6H3V4ZM3 19H17V21H3V19ZM3 14H21V16H3V14ZM3 9H17V11H3V9Z"></path></svg></div>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 9 ? 'active' : ''}" data-index="9">
                                    <div style="width:18px;height: 18px;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 4H21V6H3V4ZM5 19H19V21H5V19ZM3 14H21V16H3V14ZM5 9H19V11H5V9Z"></path></svg></div>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 10 ? 'active' : ''}" data-index="10">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM5 5V19H19V5H5ZM11.0026 16L6.75999 11.7574L8.17421 10.3431L11.0026 13.1716L16.6595 7.51472L18.0737 8.92893L11.0026 16Z"></path></svg>
                                    </div>
                                    <div class="ai-command-container-header-item item ${selectIndex === 11 ? 'active' : ''}" data-index="11">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM4 5V19H20V5H4ZM20 12L16.4645 15.5355L15.0503 14.1213L17.1716 12L15.0503 9.87868L16.4645 8.46447L20 12ZM6.82843 12L8.94975 14.1213L7.53553 15.5355L4 12L7.53553 8.46447L8.94975 9.87868L6.82843 12ZM11.2443 17H9.11597L12.7557 7H14.884L11.2443 17Z"></path></svg>
                                    </div>
                                </div>
                                <hr/>
                                ${suggestionProps.items.map((item, index) => {
                            return `<div class="ai-command-container-item item ${selectIndex === 12 + index ? 'active' : ''}" data-index="${12 + index}">${item.icon} ${item.name}</div>`
                        }).join('')}
                            </div>
                            `
                        element.addEventListener("click", (e) => {
                            const closest = (e.target as HTMLElement).closest(".item");
                            if (closest) {
                                const selectIndex = Number(closest.getAttribute("data-index"));
                                suggestionProps.command({
                                    index: selectIndex,
                                    aiItem: selectIndex > 11 ? suggestionProps.items[selectIndex - 12] : null
                                })
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
                                if (selectIndex < 6) {
                                    selectIndex = 11 + suggestionProps.items.length
                                } else if (selectIndex <= 11) {
                                    selectIndex -= 6;
                                } else {
                                    selectIndex -= 1;
                                    if (selectIndex < 0) {
                                        selectIndex = 11 + suggestionProps.items.length;
                                    }
                                }
                                updateElement();
                                return true;
                            } else if (props.event.key === "ArrowDown") {
                                if (selectIndex < 6) {
                                    selectIndex += 6
                                } else if (selectIndex < 11) {
                                    selectIndex = 12
                                } else {
                                    selectIndex += 1;
                                    if (selectIndex > 11 + suggestionProps.items.length) {
                                        selectIndex = 0;
                                    }
                                }
                                updateElement();
                                return true;
                            } else if (props.event.key === "ArrowLeft") {
                                selectIndex -= 1;
                                if (selectIndex < 0) {
                                    selectIndex = 11 + suggestionProps.items.length;
                                }
                                updateElement();
                                return true;
                            } else if (props.event.key === "ArrowRight") {
                                selectIndex += 1;
                                if (selectIndex > 11 + suggestionProps.items.length) {
                                    selectIndex = 0;
                                }
                                updateElement();
                                return true;
                            } else if (props.event.key === "Enter") {
                                suggestionProps.command({
                                    index: selectIndex,
                                    aiItem: selectIndex > 11 ? suggestionProps.items[selectIndex - 12] : null
                                })
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