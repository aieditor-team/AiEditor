import {AIBubbleMenuItem, BubbleMenuItem} from "../../types.ts";
import {t} from "i18next";
import {InnerEditor} from "../../../../core/AiEditor.ts";
import {AiModelManager} from "../../../../ai/AiModelManager.ts";
import {Svgs} from "../../../../commons/Svgs.ts";
import {AiClient} from "../../../../ai/core/AiClient.ts";
import tippy, {Instance} from "tippy.js";
import {isNodeSelection, posToDOMRect} from "@tiptap/core";


type Holder = {
    editor?: InnerEditor,
    aiPanelInstance?: Instance,
    tippyInstance?: Instance,
    aiClient?: AiClient
}


export const defaultAiPanelMenus = [
    {
        prompt: `<content>{content}</content>\n请帮我优化一下这段内容，并直接返回优化后的结果。\n注意：你应该先判断一下这句话是中文还是英文，如果是中文，请给我返回中文的内容，如果是英文，请给我返回英文内容，只需要返回内容即可，不需要告知我是中文还是英文。`,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.1986 9.94447C14.7649 9.5337 14.4859 8.98613 14.4085 8.39384L14.0056 5.31138L11.275 6.79724C10.7503 7.08274 10.1433 7.17888 9.55608 7.06948L6.49998 6.50015L7.06931 9.55625C7.17871 10.1435 7.08257 10.7505 6.79707 11.2751L5.31121 14.0057L8.39367 14.4086C8.98596 14.4861 9.53353 14.7651 9.94431 15.1987L12.0821 17.4557L13.4178 14.6486C13.6745 14.1092 14.109 13.6747 14.6484 13.418L17.4555 12.0823L15.1986 9.94447ZM15.2238 15.5079L13.0111 20.1581C12.8687 20.4573 12.5107 20.5844 12.2115 20.442C12.1448 20.4103 12.0845 20.3665 12.0337 20.3129L8.49229 16.5741C8.39749 16.474 8.27113 16.4096 8.13445 16.3918L3.02816 15.7243C2.69958 15.6814 2.46804 15.3802 2.51099 15.0516C2.52056 14.9784 2.54359 14.9075 2.5789 14.8426L5.04031 10.3192C5.1062 10.1981 5.12839 10.058 5.10314 9.92253L4.16 4.85991C4.09931 4.53414 4.3142 4.22086 4.63997 4.16017C4.7126 4.14664 4.78711 4.14664 4.85974 4.16017L9.92237 5.10331C10.0579 5.12855 10.198 5.10637 10.319 5.04048L14.8424 2.57907C15.1335 2.42068 15.4979 2.52825 15.6562 2.81931C15.6916 2.88421 15.7146 2.95507 15.7241 3.02833L16.3916 8.13462C16.4095 8.2713 16.4739 8.39766 16.5739 8.49245L20.3127 12.0338C20.5533 12.2617 20.5636 12.6415 20.3357 12.8821C20.2849 12.9357 20.2246 12.9795 20.1579 13.0112L15.5078 15.224C15.3833 15.2832 15.283 15.3835 15.2238 15.5079ZM16.0206 17.435L17.4348 16.0208L21.6775 20.2634L20.2633 21.6776L16.0206 17.435Z"></path></svg>`,
        title: 'improve-writing',
    },
    {
        prompt: `<content>{content}</content>\n请帮我检查一下这段内容，是否有拼写错误或者语法上的错误。\n注意：你应该先判断一下这句话是中文还是英文，如果是中文，请给我返回中文的内容，如果是英文，请给我返回英文内容，只需要返回内容即可，不需要告知我是中文还是英文。`,
        icon: ` <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 19C12.8284 19 13.5 19.6716 13.5 20.5C13.5 21.3284 12.8284 22 12 22C11.1716 22 10.5 21.3284 10.5 20.5C10.5 19.6716 11.1716 19 12 19ZM6.5 19C7.32843 19 8 19.6716 8 20.5C8 21.3284 7.32843 22 6.5 22C5.67157 22 5 21.3284 5 20.5C5 19.6716 5.67157 19 6.5 19ZM17.5 19C18.3284 19 19 19.6716 19 20.5C19 21.3284 18.3284 22 17.5 22C16.6716 22 16 21.3284 16 20.5C16 19.6716 16.6716 19 17.5 19ZM13 2V4H19V6L17.0322 6.0006C16.2423 8.3666 14.9984 10.5065 13.4107 12.302C14.9544 13.6737 16.7616 14.7204 18.7379 15.3443L18.2017 17.2736C15.8917 16.5557 13.787 15.3326 12.0005 13.7257C10.214 15.332 8.10914 16.5553 5.79891 17.2734L5.26257 15.3442C7.2385 14.7203 9.04543 13.6737 10.5904 12.3021C9.46307 11.0285 8.50916 9.58052 7.76789 8.00128L10.0074 8.00137C10.5706 9.03952 11.2401 10.0037 11.9998 10.8772C13.2283 9.46508 14.2205 7.81616 14.9095 6.00101L5 6V4H11V2H13Z"></path></svg>`,
        title: 'check-spelling-and-grammar',
    },
    {
        prompt: `<content>{content}</content>\n这句话的内容较长，帮我简化一下这个内容，并直接返回简化后的内容结果。\n注意：你应该先判断一下这句话是中文还是英文，如果是中文，请给我返回中文的内容，如果是英文，请给我返回英文内容，只需要返回内容即可，不需要告知我是中文还是英文。`,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6.75736L19 8.75736V4H10V9H5V20H19V17.2426L21 15.2426V21.0082C21 21.556 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5501 3 20.9932V8L9.00319 2H19.9978C20.5513 2 21 2.45531 21 2.9918V6.75736ZM21.7782 8.80761L23.1924 10.2218L15.4142 18L13.9979 17.9979L14 16.5858L21.7782 8.80761Z"></path></svg>`,
        title: 'make-shorter',
    },
    {
        prompt: `<content>{content}</content>\n这句话的内容较简短，帮我简单的优化和丰富一下内容，并直接返回优化后的结果。注意：优化的内容不能超过原来内容的 2 倍。\n注意：你应该先判断一下这句话是中文还是英文，如果是中文，请给我返回中文的内容，如果是英文，请给我返回英文内容，只需要返回内容即可，不需要告知我是中文还是英文。`,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2C20.5523 2 21 2.44772 21 3V6.757L19 8.757V4H5V20H19V17.242L21 15.242V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20ZM21.7782 8.80761L23.1924 10.2218L15.4142 18L13.9979 17.9979L14 16.5858L21.7782 8.80761ZM13 12V14H8V12H13ZM16 8V10H8V8H16Z"></path></svg>`,
        title: 'make-longer',
    },
    '<hr/>',
    {
        prompt: `<content>{content}</content>\n请帮我翻译以上内容，在翻译之前，想先判断一下这个内容是不是中文，如果是中文，则翻译问英文，如果是其他语言，则需要翻译为中文，注意，你只需要返回翻译的结果，不需要对此进行任何解释，不需要除了翻译结果以外的其他任何内容。`,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 15V17C5 18.0544 5.81588 18.9182 6.85074 18.9945L7 19H10V21H7C4.79086 21 3 19.2091 3 17V15H5ZM18 10L22.4 21H20.245L19.044 18H14.954L13.755 21H11.601L16 10H18ZM17 12.8852L15.753 16H18.245L17 12.8852ZM8 2V4H12V11H8V14H6V11H2V4H6V2H8ZM17 3C19.2091 3 21 4.79086 21 7V9H19V7C19 5.89543 18.1046 5 17 5H14V3H17ZM6 6H4V9H6V6ZM10 6H8V9H10V6Z"></path></svg>`,
        title: 'translate',
    },
    {
        prompt: `<content>{content}</content>\n请帮我总结以上内容，并直接返回总结的结果\n注意：你应该先判断一下这句话是中文还是英文，如果是中文，请给我返回中文的内容，如果是英文，请给我返回英文内容，只需要返回内容即可，不需要告知我是中文还是英文。`,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3C19.6569 3 21 4.34315 21 6C21 7.65685 19.6569 9 18 9H15C13.6941 9 12.5831 8.16562 12.171 7.0009L11 7C9.9 7 9 7.9 9 9L9.0009 9.17102C10.1656 9.58312 11 10.6941 11 12C11 13.3059 10.1656 14.4169 9.0009 14.829L9 15C9 16.1 9.9 17 11 17L12.1707 17.0001C12.5825 15.8349 13.6937 15 15 15H18C19.6569 15 21 16.3431 21 18C21 19.6569 19.6569 21 18 21H15C13.6941 21 12.5831 20.1656 12.171 19.0009L11 19C8.79 19 7 17.21 7 15H5C3.34315 15 2 13.6569 2 12C2 10.3431 3.34315 9 5 9H7C7 6.79086 8.79086 5 11 5L12.1707 5.00009C12.5825 3.83485 13.6937 3 15 3H18ZM18 17H15C14.4477 17 14 17.4477 14 18C14 18.5523 14.4477 19 15 19H18C18.5523 19 19 18.5523 19 18C19 17.4477 18.5523 17 18 17ZM8 11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H8C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11ZM18 5H15C14.4477 5 14 5.44772 14 6C14 6.55228 14.4477 7 15 7H18C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z"></path></svg>`,
        title: 'summarize',
    },
] as AIBubbleMenuItem[]

const startChat = (holder: Holder, container: HTMLDivElement, prompt: string) => {
    if (holder.aiClient) {
        holder.aiClient.stop();
    } else {
        const textarea = container.querySelector("textarea")!;
        textarea.value = "";
        const {selection, doc} = holder.editor!.state
        const selectedText = doc.textBetween(selection.from, selection.to);
        const options = holder.editor!.aiEditor.options;
        const aiModel = AiModelManager.get(options.ai?.bubblePanelModel!);
        if (aiModel) {
            aiModel.chat(selectedText, prompt, {
                onStart(aiClient) {
                    holder.aiClient = aiClient;
                    container.querySelector<HTMLElement>(".aie-ai-panel-actions")!.style.display = "none";
                    container.querySelector<HTMLElement>(".loader")!.style.display = "block";
                    container.querySelector<HTMLElement>(".aie-ai-panel-body-content")!.style.display = "block";
                    container.querySelector("#go")!.innerHTML = Svgs.aiPanelStop;
                },
                onStop() {
                    holder.aiClient = undefined;
                    container.querySelector("#go")!.innerHTML = Svgs.aiPanelStart;
                    container.querySelector<HTMLElement>(".aie-ai-panel-footer")!.style.display = "block";
                    container.querySelector<HTMLElement>(".loader")!.style.display = "none";
                    container.querySelector<HTMLElement>(".aie-ai-panel-actions")!.style.display = "none";
                },
                onMessage(message) {
                    textarea!.value = textarea?.value + message.content;
                }
            })
        } else {
            console.error("AI model name config error. can not get AI model by name: \"" + options.ai?.bubblePanelModel + "\", please check config \"options.ai.bubblePanelModel\"")
        }
    }
}

const createAiPanelElement = (holder: Holder, aiBubbleMenuItems: AIBubbleMenuItem[]) => {
    const container = document.createElement("div");
    container.classList.add("aie-ai-panel")
    container.innerHTML = `
        <div class="aie-ai-panel-body">
            <div class="aie-ai-panel-body-content" style="display: none"><div class="loader">${Svgs.refresh}</div><textarea readonly></textarea></div>
            <div class="aie-ai-panel-body-input"><input id="prompt" placeholder="${t('placeholder-tell-ai-what-to-do-next')}" type="text" />
            <button type="button" id="go" style="width: 30px;height: 30px">${Svgs.aiPanelStart}</button></div>
            <div class="aie-ai-panel-body-tips"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 17C9 17 16 18 19 21H20C20.5523 21 21 20.5523 21 20V13.937C21.8626 13.715 22.5 12.9319 22.5 12C22.5 11.0681 21.8626 10.285 21 10.063V4C21 3.44772 20.5523 3 20 3H19C16 6 9 7 9 7H5C3.89543 7 3 7.89543 3 9V15C3 16.1046 3.89543 17 5 17H6L7 22H9V17ZM11 8.6612C11.6833 8.5146 12.5275 8.31193 13.4393 8.04373C15.1175 7.55014 17.25 6.77262 19 5.57458V18.4254C17.25 17.2274 15.1175 16.4499 13.4393 15.9563C12.5275 15.6881 11.6833 15.4854 11 15.3388V8.6612ZM5 9H9V15H5V9Z" fill="currentColor"></path></svg>
            ${t("tip-you-can-enter-text-above-or-select-the-operation-below")}</div>
        </div>
        <div class="aie-ai-panel-footer" style="display: none">
        <div class="aie-ai-panel-footer-tips">${t("you-can-do-the-following")}</div>
        <p id="insert"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 18H12V20H2V18ZM2 11H22V13H2V11ZM2 4H22V6H2V4ZM18 18V15H20V18H23V20H20V23H18V20H15V18H18Z" fill="currentColor"></path></svg> 
        ${t("ai-append")}</p>
        <p id="replace"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10.071 4.92902L11.4852 6.34323L6.82834 11.0001L16.0002 11.0002L16.0002 13.0002L6.82839 13.0001L11.4852 17.6569L10.071 19.0712L2.99994 12.0001L10.071 4.92902ZM18.0001 19V5.00003H20.0001V19H18.0001Z" fill="currentColor"></path></svg> 
        ${t("ai-replace")}</p>
        <hr/>
        <p id="hide"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 4V6H15V4H9Z" fill="currentColor"></path></svg> 
        ${t("ai-cancel")}</p>
        </div>
        
        <!--aie-ai-panel-actions-->
        <div class="aie-ai-panel-footer aie-ai-panel-actions" >
        <div class="aie-ai-panel-footer-tips">${t("you-can-do-the-following")}</div>
        ${aiBubbleMenuItems.map((menuItem) => {
        return typeof menuItem === "string" ? menuItem :
            `<p data-prompt="${menuItem.prompt}">${menuItem.icon} ${t(menuItem.title)} </p>`;
    }).join('')}
        </div>
        `;

    container.querySelector("#replace")!.addEventListener("click", () => {
        const textarea = container.querySelector("textarea")!;
        if (textarea.value) {
            const {state: {selection, tr}, view: {dispatch}, schema} = holder.editor!
            const textNode = schema.text(textarea.value);
            dispatch(tr.replaceRangeWith(selection.from, selection.to, textNode))
            holder.aiPanelInstance?.hide();
            holder.tippyInstance?.show();
        }
    });

    container.querySelector("#insert")!.addEventListener("click", () => {
        const textarea = container.querySelector("textarea")!;
        if (textarea.value) {
            const {state: {selection, tr}, view: {dispatch}} = holder.editor!
            dispatch(tr.insertText(textarea.value, selection.to))
            holder.aiPanelInstance?.hide();
            holder.tippyInstance?.show();
        }
    });

    container.querySelector("#hide")!.addEventListener("click", () => {
        holder.aiPanelInstance?.hide();
        holder.tippyInstance?.show();
    });

    container.querySelector("#go")!.addEventListener("click", () => {
        const prompt = (container.querySelector("#prompt") as HTMLInputElement).value
        startChat(holder, container, prompt);
    });

    container.querySelectorAll(".aie-ai-panel-actions p").forEach((element) => {
        const prompt = element.getAttribute("data-prompt")!;
        element.addEventListener("click", () => {
            startChat(holder, container, prompt);
        })
    })

    return container;
}


export const AI = {
    id: "ai",
    title: "ai",
    icon: `<div style="display: flex;height: 20px">
                      <div style="width: 18px;height: 18px;display: inline-block" >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(100,205,138,1)"><path d="M13.5 2C13.5 2.44425 13.3069 2.84339 13 3.11805V5H18C19.6569 5 21 6.34315 21 8V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V8C3 6.34315 4.34315 5 6 5H11V3.11805C10.6931 2.84339 10.5 2.44425 10.5 2C10.5 1.17157 11.1716 0.5 12 0.5C12.8284 0.5 13.5 1.17157 13.5 2ZM6 7C5.44772 7 5 7.44772 5 8V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V8C19 7.44772 18.5523 7 18 7H13H11H6ZM2 10H0V16H2V10ZM22 10H24V16H22V10ZM9 14.5C9.82843 14.5 10.5 13.8284 10.5 13C10.5 12.1716 9.82843 11.5 9 11.5C8.17157 11.5 7.5 12.1716 7.5 13C7.5 13.8284 8.17157 14.5 9 14.5ZM15 14.5C15.8284 14.5 16.5 13.8284 16.5 13C16.5 12.1716 15.8284 11.5 15 11.5C14.1716 11.5 13.5 12.1716 13.5 13C13.5 13.8284 14.1716 14.5 15 14.5Z"></path></svg>
                      </div>
                     <div style="width: 18px;height: 18px;display: inline-block" >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 14L8 10H16L12 14Z"></path></svg>
                     </div>
                 </div>
                `,
    onInit: ({innerEditor}, tippyInstance, parentEle) => {
        const holder: Holder = {editor: innerEditor, tippyInstance};
        const aiPanelMenus = innerEditor.aiEditor.options.ai?.bubblePanelMenus || defaultAiPanelMenus;
        holder.aiPanelInstance = tippy(parentEle.querySelector("#ai")!, {
            content: createAiPanelElement(holder, aiPanelMenus),
            appendTo: innerEditor!.view.dom.closest(".aie-container")!,
            placement: "bottom",
            trigger: 'click',
            interactive: true,
            arrow: false,
            getReferenceClientRect: (() => {
                const {state, view} = innerEditor
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
        return holder;
    },

    onClick: (____, _, __, holder: Holder) => {
        holder.tippyInstance?.hide()
    }
} as BubbleMenuItem