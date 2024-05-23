import {AbstractBubbleMenu} from "../AbstractBubbleMenu.ts";
import {EditorEvents, isNodeSelection, posToDOMRect} from "@tiptap/core";
import {t} from "i18next";
import tippy, {Instance} from "tippy.js";
import {AiModelManager} from "../../ai/AiModelManager.ts";
import {AiEditorOptions, InnerEditor} from "../../core/AiEditor.ts";
import {Svgs} from "../../commons/Svgs.ts";
import {AiClient} from "../../ai/core/AiClient.ts";


export class TextSelectionBubbleMenu extends AbstractBubbleMenu {

    tippyInstance?: Instance;
    aiBubbleInstance?: Instance;
    bubblePanelEnable = true;
    aiClient?: AiClient | null;

    constructor() {
        super();
        this.items = [
            {
                id: "ai",
                title: t("ai"),
                content: `
                <div style="display: flex;height: 20px">
                     <div style="line-height: 20px"> AI </div>
                     <div style="width: 18px;height: 18px;display: inline-block" >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 14L8 10H16L12 14Z"></path></svg>
                     </div>
                 </div>
                `,
            },
            {
                id: "bold",
                title: t("bold"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M8 11H12.5C13.8807 11 15 9.88071 15 8.5C15 7.11929 13.8807 6 12.5 6H8V11ZM18 15.5C18 17.9853 15.9853 20 13.5 20H6V4H12.5C14.9853 4 17 6.01472 17 8.5C17 9.70431 16.5269 10.7981 15.7564 11.6058C17.0979 12.3847 18 13.837 18 15.5ZM8 13V18H13.5C14.8807 18 16 16.8807 16 15.5C16 14.1193 14.8807 13 13.5 13H8Z\"></path></svg>",
            },
            {
                id: "italic",
                title: t("italic"),
                content: " <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M15 20H7V18H9.92661L12.0425 6H9V4H17V6H14.0734L11.9575 18H15V20Z\"></path></svg>"
            },
            {
                id: "underline",
                title: t("underline"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M8 3V12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12V3H18V12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12V3H8ZM4 20H20V22H4V20Z\"></path></svg>"
            },
            {
                id: "strike",
                title: t("strike"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M17.1538 14C17.3846 14.5161 17.5 15.0893 17.5 15.7196C17.5 17.0625 16.9762 18.1116 15.9286 18.867C14.8809 19.6223 13.4335 20 11.5862 20C9.94674 20 8.32335 19.6185 6.71592 18.8555V16.6009C8.23538 17.4783 9.7908 17.917 11.3822 17.917C13.9333 17.917 15.2128 17.1846 15.2208 15.7196C15.2208 15.0939 15.0049 14.5598 14.5731 14.1173C14.5339 14.0772 14.4939 14.0381 14.4531 14H3V12H21V14H17.1538ZM13.076 11H7.62908C7.4566 10.8433 7.29616 10.6692 7.14776 10.4778C6.71592 9.92084 6.5 9.24559 6.5 8.45207C6.5 7.21602 6.96583 6.165 7.89749 5.299C8.82916 4.43299 10.2706 4 12.2219 4C13.6934 4 15.1009 4.32808 16.4444 4.98426V7.13591C15.2448 6.44921 13.9293 6.10587 12.4978 6.10587C10.0187 6.10587 8.77917 6.88793 8.77917 8.45207C8.77917 8.87172 8.99709 9.23796 9.43293 9.55079C9.86878 9.86362 10.4066 10.1135 11.0463 10.3004C11.6665 10.4816 12.3431 10.7148 13.076 11H13.076Z\"></path></svg>"
            },
            {
                id: "code",
                title: t("code"),
                content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M23 11.9998L15.9289 19.0708L14.5147 17.6566L20.1716 11.9998L14.5147 6.34292L15.9289 4.92871L23 11.9998ZM3.82843 11.9998L9.48528 17.6566L8.07107 19.0708L1 11.9998L8.07107 4.92871L9.48528 6.34292L3.82843 11.9998Z\"></path></svg>"
            }
        ]
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.bubblePanelEnable) {
            this.aiBubbleInstance = tippy(this.querySelector("#ai")!, {
                content: this.createAiPanelElement(),
                appendTo: this.editor!.view.dom.closest(".aie-container")!,
                placement: "bottom",
                trigger: 'click',
                interactive: true,
                arrow: false,
                getReferenceClientRect: (() => {
                    const {state, view} = this.editor!
                    const {ranges} = state.selection
                    const from = Math.min(...ranges.map(range => range.$from.pos))
                    const to = Math.max(...ranges.map(range => range.$to.pos))
                    if (isNodeSelection(state.selection)) {
                        let node = view.nodeDOM(from) as HTMLElement
                        const nodeViewWrapper = node.dataset.nodeViewWrapper ? node : node.querySelector('[data-node-view-wrapper]')
                        if (nodeViewWrapper) {
                            node = nodeViewWrapper.firstChild as HTMLElement
                        }
                        if (node) {
                            return node.getBoundingClientRect()
                        }
                    }
                    return posToDOMRect(view, from, to)
                }),
                onShow: (_) => {
                    window.setTimeout(() => _.popper.querySelector<HTMLInputElement>("#prompt")?.focus(), 0);
                }
            })
        }
    }

    onCreate(props: EditorEvents["create"], _: AiEditorOptions) {
        super.onCreate(props, _);
        const options = (this.editor as InnerEditor).userOptions;
        if (options.ai && options.ai.bubblePanelEnable === false) {
            this.bubblePanelEnable = false;
            this.items = this.items.filter(item => item.id !== "ai");
        }
    }


    set instance(value: Instance) {
        this.tippyInstance = value;
    }

    onItemClick(_id: string): void {
        switch (_id) {
            case "ai":
                this.tippyInstance?.hide();
                break
            case "bold":
                this.editor?.chain().toggleBold().run();
                break;
            case "italic":
                this.editor?.chain().toggleItalic().run();
                break;
            case "underline":
                this.editor?.chain().toggleUnderline().run();
                break;
            case "strike":
                this.editor?.chain().toggleStrike().run();
                break;
            case "code":
                this.editor?.chain().toggleCode().run();
                break;
        }

    }

    onTransaction(_: EditorEvents["transaction"]): void {
    }

    private createAiPanelElement() {
        const container = document.createElement("div");
        container.classList.add("aie-ai-panel")
        container.innerHTML = `
        <div class="aie-ai-panel-body">
            <div class="aie-ai-panel-body-content" style="display: none"><div class="loader">${Svgs.refresh}</div><textarea readonly></textarea></div>
            <div class="aie-ai-panel-body-input"><input id="prompt" placeholder="告诉 AI 下一步应该如何？比如：帮我翻译成英语" type="text" />
            <button type="button" id="go" style="width: 30px;height: 30px">${Svgs.aiPanelStart}</button></div>
            <div class="aie-ai-panel-body-tips"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 17C9 17 16 18 19 21H20C20.5523 21 21 20.5523 21 20V13.937C21.8626 13.715 22.5 12.9319 22.5 12C22.5 11.0681 21.8626 10.285 21 10.063V4C21 3.44772 20.5523 3 20 3H19C16 6 9 7 9 7H5C3.89543 7 3 7.89543 3 9V15C3 16.1046 3.89543 17 5 17H6L7 22H9V17ZM11 8.6612C11.6833 8.5146 12.5275 8.31193 13.4393 8.04373C15.1175 7.55014 17.25 6.77262 19 5.57458V18.4254C17.25 17.2274 15.1175 16.4499 13.4393 15.9563C12.5275 15.6881 11.6833 15.4854 11 15.3388V8.6612ZM5 9H9V15H5V9Z" fill="currentColor"></path></svg>
            提示：您可以在上面输入文字或者选择下方的操作</div>
        </div>
        <div class="aie-ai-panel-footer" style="display: none">
        <div class="aie-ai-panel-footer-tips">您可以进行以下操作:</div>
        <p id="insert"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 18H12V20H2V18ZM2 11H22V13H2V11ZM2 4H22V6H2V4ZM18 18V15H20V18H23V20H20V23H18V20H15V18H18Z" fill="currentColor"></path></svg> 追加</p>
        <p id="replace"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10.071 4.92902L11.4852 6.34323L6.82834 11.0001L16.0002 11.0002L16.0002 13.0002L6.82839 13.0001L11.4852 17.6569L10.071 19.0712L2.99994 12.0001L10.071 4.92902ZM18.0001 19V5.00003H20.0001V19H18.0001Z" fill="currentColor"></path></svg> 替换</p>
        <hr/>
        <p id="hide"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 4V6H15V4H9Z" fill="currentColor"></path></svg> 放弃</p>
        </div>
        
        <!--actions-->
        <div class="aie-ai-panel-footer actions" >
        <div class="aie-ai-panel-footer-tips">您可以进行以下操作:</div>
        <p data-prompt="请帮我优化一下这段内容，并直接返回优化后的结果。">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.1986 9.94447C14.7649 9.5337 14.4859 8.98613 14.4085 8.39384L14.0056 5.31138L11.275 6.79724C10.7503 7.08274 10.1433 7.17888 9.55608 7.06948L6.49998 6.50015L7.06931 9.55625C7.17871 10.1435 7.08257 10.7505 6.79707 11.2751L5.31121 14.0057L8.39367 14.4086C8.98596 14.4861 9.53353 14.7651 9.94431 15.1987L12.0821 17.4557L13.4178 14.6486C13.6745 14.1092 14.109 13.6747 14.6484 13.418L17.4555 12.0823L15.1986 9.94447ZM15.2238 15.5079L13.0111 20.1581C12.8687 20.4573 12.5107 20.5844 12.2115 20.442C12.1448 20.4103 12.0845 20.3665 12.0337 20.3129L8.49229 16.5741C8.39749 16.474 8.27113 16.4096 8.13445 16.3918L3.02816 15.7243C2.69958 15.6814 2.46804 15.3802 2.51099 15.0516C2.52056 14.9784 2.54359 14.9075 2.5789 14.8426L5.04031 10.3192C5.1062 10.1981 5.12839 10.058 5.10314 9.92253L4.16 4.85991C4.09931 4.53414 4.3142 4.22086 4.63997 4.16017C4.7126 4.14664 4.78711 4.14664 4.85974 4.16017L9.92237 5.10331C10.0579 5.12855 10.198 5.10637 10.319 5.04048L14.8424 2.57907C15.1335 2.42068 15.4979 2.52825 15.6562 2.81931C15.6916 2.88421 15.7146 2.95507 15.7241 3.02833L16.3916 8.13462C16.4095 8.2713 16.4739 8.39766 16.5739 8.49245L20.3127 12.0338C20.5533 12.2617 20.5636 12.6415 20.3357 12.8821C20.2849 12.9357 20.2246 12.9795 20.1579 13.0112L15.5078 15.224C15.3833 15.2832 15.283 15.3835 15.2238 15.5079ZM16.0206 17.435L17.4348 16.0208L21.6775 20.2634L20.2633 21.6776L16.0206 17.435Z"></path></svg>
            改进写作
        </p>
        <p data-prompt="请帮我检查一下这段内容，是否有拼写错误或者语法上的错误。">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 19C12.8284 19 13.5 19.6716 13.5 20.5C13.5 21.3284 12.8284 22 12 22C11.1716 22 10.5 21.3284 10.5 20.5C10.5 19.6716 11.1716 19 12 19ZM6.5 19C7.32843 19 8 19.6716 8 20.5C8 21.3284 7.32843 22 6.5 22C5.67157 22 5 21.3284 5 20.5C5 19.6716 5.67157 19 6.5 19ZM17.5 19C18.3284 19 19 19.6716 19 20.5C19 21.3284 18.3284 22 17.5 22C16.6716 22 16 21.3284 16 20.5C16 19.6716 16.6716 19 17.5 19ZM13 2V4H19V6L17.0322 6.0006C16.2423 8.3666 14.9984 10.5065 13.4107 12.302C14.9544 13.6737 16.7616 14.7204 18.7379 15.3443L18.2017 17.2736C15.8917 16.5557 13.787 15.3326 12.0005 13.7257C10.214 15.332 8.10914 16.5553 5.79891 17.2734L5.26257 15.3442C7.2385 14.7203 9.04543 13.6737 10.5904 12.3021C9.46307 11.0285 8.50916 9.58052 7.76789 8.00128L10.0074 8.00137C10.5706 9.03952 11.2401 10.0037 11.9998 10.8772C13.2283 9.46508 14.2205 7.81616 14.9095 6.00101L5 6V4H11V2H13Z"></path></svg>
            检查拼写和语法
        </p>
        <p data-prompt="这句话的内容较长，帮我简化一下这个内容，并直接返回简化后的内容结果">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6.75736L19 8.75736V4H10V9H5V20H19V17.2426L21 15.2426V21.0082C21 21.556 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5501 3 20.9932V8L9.00319 2H19.9978C20.5513 2 21 2.45531 21 2.9918V6.75736ZM21.7782 8.80761L23.1924 10.2218L15.4142 18L13.9979 17.9979L14 16.5858L21.7782 8.80761Z"></path></svg>
            简化内容
        </p>
        <p data-prompt="这句话的内容较剪短，帮我简单的优化和丰富一下内容，并直接返回优化后的结果。注意：优化的内容不能超过原来内容的 2 倍。">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2C20.5523 2 21 2.44772 21 3V6.757L19 8.757V4H5V20H19V17.242L21 15.242V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20ZM21.7782 8.80761L23.1924 10.2218L15.4142 18L13.9979 17.9979L14 16.5858L21.7782 8.80761ZM13 12V14H8V12H13ZM16 8V10H8V8H16Z"></path></svg>
            丰富内容
        </p>
        <hr/>
        <p data-prompt="请帮我翻译以上内容，在翻译之前，想先判断一下这个内容是不是中文，如果是中文，则翻译问英文，如果是其他语言，则需要翻译为中文，注意，你只需要返回翻译的结果，不需要对此进行任何解释，不需要除了翻译结果以外的其他任何内容。">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 15V17C5 18.0544 5.81588 18.9182 6.85074 18.9945L7 19H10V21H7C4.79086 21 3 19.2091 3 17V15H5ZM18 10L22.4 21H20.245L19.044 18H14.954L13.755 21H11.601L16 10H18ZM17 12.8852L15.753 16H18.245L17 12.8852ZM8 2V4H12V11H8V14H6V11H2V4H6V2H8ZM17 3C19.2091 3 21 4.79086 21 7V9H19V7C19 5.89543 18.1046 5 17 5H14V3H17ZM6 6H4V9H6V6ZM10 6H8V9H10V6Z"></path></svg>
            翻译
        </p>
        <p data-prompt="请帮我总结以上内容，并直接返回总结的结果">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3C19.6569 3 21 4.34315 21 6C21 7.65685 19.6569 9 18 9H15C13.6941 9 12.5831 8.16562 12.171 7.0009L11 7C9.9 7 9 7.9 9 9L9.0009 9.17102C10.1656 9.58312 11 10.6941 11 12C11 13.3059 10.1656 14.4169 9.0009 14.829L9 15C9 16.1 9.9 17 11 17L12.1707 17.0001C12.5825 15.8349 13.6937 15 15 15H18C19.6569 15 21 16.3431 21 18C21 19.6569 19.6569 21 18 21H15C13.6941 21 12.5831 20.1656 12.171 19.0009L11 19C8.79 19 7 17.21 7 15H5C3.34315 15 2 13.6569 2 12C2 10.3431 3.34315 9 5 9H7C7 6.79086 8.79086 5 11 5L12.1707 5.00009C12.5825 3.83485 13.6937 3 15 3H18ZM18 17H15C14.4477 17 14 17.4477 14 18C14 18.5523 14.4477 19 15 19H18C18.5523 19 19 18.5523 19 18C19 17.4477 18.5523 17 18 17ZM8 11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H8C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11ZM18 5H15C14.4477 5 14 5.44772 14 6C14 6.55228 14.4477 7 15 7H18C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z"></path></svg>
            总结
        </p>
        </div>
        `;

        container.querySelector("#replace")!.addEventListener("click", () => {
            const textarea = container.querySelector("textarea")!;
            if (textarea.value) {
                const {state: {selection, tr}, view: {dispatch}, schema} = this.editor!
                const textNode = schema.text(textarea.value);
                dispatch(tr.replaceRangeWith(selection.from, selection.to, textNode))
                this.aiBubbleInstance?.hide();
                this.tippyInstance?.show();
            }
        });

        container.querySelector("#insert")!.addEventListener("click", () => {
            const textarea = container.querySelector("textarea")!;
            if (textarea.value) {

                // const {state: {selection, tr}, view: {dispatch}, schema} = this.editor!
                // const node = schema.node("paragraph", null, schema.text(textarea.value));
                // dispatch(tr.setSelection(TextSelection.create(tr.doc, selection.to))
                //     .insert(selection.to, node)
                //     .setSelection(TextSelection.create(tr.doc, selection.to + textarea.value.length + 2))
                // )

                const {state: {selection, tr}, view: {dispatch}} = this.editor!
                dispatch(tr.insertText(textarea.value, selection.to))
                this.aiBubbleInstance?.hide();
                this.tippyInstance?.show();
            }
        });

        container.querySelector("#hide")!.addEventListener("click", () => {
            this.aiBubbleInstance?.hide();
            this.tippyInstance?.show();
        });

        container.querySelector("#go")!.addEventListener("click", () => {
            const prompt = (container.querySelector("#prompt") as HTMLInputElement).value
            this.startChat(container, prompt);
        });

        container.querySelectorAll(".actions p").forEach((element) => {
            const prompt = element.getAttribute("data-prompt")!;
            element.addEventListener("click", () => {
                this.startChat(container, prompt);
            })
        })

        return container;
    }


    private startChat(container: HTMLDivElement, prompt: string) {
        if (this.aiClient) {
            this.aiClient.stop();
        } else {
            const textarea = container.querySelector("textarea")!;
            textarea.value = "";
            const {selection, doc} = this.editor!.state
            const selectedText = doc.textBetween(selection.from, selection.to);
            const options = (this.editor as InnerEditor).userOptions;
            const aiModel = AiModelManager.get(options.ai?.bubblePanelModel!);
            if (aiModel) {
                const menu = this;
                aiModel.chat(selectedText, prompt, {
                    onStart(aiClient) {
                        menu.aiClient = aiClient;
                        container.querySelector<HTMLElement>(".actions")!.style.display = "none";
                        container.querySelector<HTMLElement>(".loader")!.style.display = "block";
                        container.querySelector<HTMLElement>(".aie-ai-panel-body-content")!.style.display = "block";
                        container.querySelector("#go")!.innerHTML = Svgs.aiPanelStop;
                    },
                    onStop() {
                        menu.aiClient = null;
                        container.querySelector("#go")!.innerHTML = Svgs.aiPanelStart;
                        container.querySelector<HTMLElement>(".aie-ai-panel-footer")!.style.display = "block";
                        container.querySelector<HTMLElement>(".loader")!.style.display = "none";
                        container.querySelector<HTMLElement>(".actions")!.style.display = "none";
                    },
                    onMessage(message) {
                        textarea!.value = textarea?.value + message.content;
                    }
                })
            } else {
                console.error("AI model name config error. can not get AI model by name: \"" + options.ai?.bubblePanelModel+"\", please check config \"options.ai.bubblePanelModel\"")
            }
        }
    }

}



