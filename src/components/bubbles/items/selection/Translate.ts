import {BubbleMenuItem, TranslateMenuItem} from "../../types.ts";
import {t} from "i18next";
import {InnerEditor} from "../../../../core/AiEditor.ts";
import {AiModelManager} from "../../../../ai/AiModelManager.ts";
import {AiClient} from "../../../../ai/core/AiClient.ts";
import tippy, {Instance} from "tippy.js";


type Holder = {
    editor?: InnerEditor,
    translatePanelInstance?: Instance,
    translateResultInstance?: Instance,
    tippyInstance?: Instance,
    aiClient?: AiClient
}


export const defaultTranslateMenuItems = [
    {title: '英语'},
    {title: '中文'},
    {title: '日语'},
    {title: '法语'},
    {title: '德语'},
    {title: '葡萄牙语'},
    {title: '西班牙语'},
] as TranslateMenuItem[]

const startChat = (holder: Holder, lang: string, textarea: HTMLTextAreaElement) => {
    if (holder.aiClient) {
        holder.aiClient.stop();
    } else {
        const {selection, doc} = holder.editor!.state
        const selectedText = doc.textBetween(selection.from, selection.to);
        let prompt = holder.editor?.aiEditor.options.ai?.translate?.prompt?.(lang, selectedText)
            || `你是一个${lang}翻译专家，精通多个国家的语言，请帮我把以下 <content> 标签里内容翻译为: ${lang}，并返回翻译后结果。您需要翻译的内容是：\n<content>${selectedText}</content>`;
        const aiModel = AiModelManager.get("auto");
        if (aiModel) {
            aiModel.chat("", prompt, {
                onStart(aiClient) {
                    holder.aiClient = aiClient;
                },
                onStop() {
                    holder.aiClient = undefined;
                },
                onMessage(message) {
                    textarea.value += message.content;
                    textarea.style.height = `${textarea.scrollHeight}px`;
                    textarea.scrollTop = textarea.scrollHeight;
                }
            })
        } else {
            console.error("AI model name config error.")
        }
    }
}

const createTranslateResultPanel = (holder: Holder) => {
    const resultPanel = document.createElement("div");
    resultPanel.classList.add("aie-translate-result-panel")
    resultPanel.innerHTML = `
    <textarea rows="5" readonly></textarea>
    <div>
     <button type="button" id="cancel"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 4V6H15V4H9Z" fill="currentColor"></path></svg> 
        ${t("ai-cancel")}</button>
     <button type="button" id="append"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 18H12V20H2V18ZM2 11H22V13H2V11ZM2 4H22V6H2V4ZM18 18V15H20V18H23V20H20V23H18V20H15V18H18Z" fill="currentColor"></path></svg> 
${t("ai-append")}</button>
     <button type="button" id="replace"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10.071 4.92902L11.4852 6.34323L6.82834 11.0001L16.0002 11.0002L16.0002 13.0002L6.82839 13.0001L11.4852 17.6569L10.071 19.0712L2.99994 12.0001L10.071 4.92902ZM18.0001 19V5.00003H20.0001V19H18.0001Z" fill="currentColor"></path></svg> 
       ${t("ai-replace")}</button>
</div>
    `

    resultPanel.querySelector("#cancel")!.addEventListener("click", () => {
        holder.translateResultInstance?.hide()
        holder.tippyInstance?.show()
    })

    resultPanel.querySelector("#append")!.addEventListener("click", () => {
        holder.translateResultInstance?.hide()
        const {state: {selection, tr}, view: {dispatch}} = holder.editor!
        dispatch(tr.insertText(resultPanel.querySelector("textarea")!.value, selection.to))
    })

    resultPanel.querySelector("#replace")!.addEventListener("click", () => {
        holder.translateResultInstance?.hide()
        holder.editor?.commands.insertContent(resultPanel.querySelector("textarea")!.value)
    })


    return resultPanel;
}

const createTranslatePanelElement = (holder: Holder, menuItems: TranslateMenuItem[]) => {
    const container = document.createElement("div");
    container.classList.add("aie-translate-panel")
    container.innerHTML = `
      <div class="aie-translate-panel-body">
        ${menuItems.map((menuItem) => {
        return typeof menuItem === "string" ? `<p data-lang="${menuItem}">${t(menuItem)} </p>`
            : `<p data-lang="${menuItem.language || menuItem.title}">${t(menuItem.title)} </p>`;
    }).join('')}
        </div>
        `;
    const aieContainer = holder.editor!.view.dom.closest(".aie-container")!;
    holder.translateResultInstance = tippy(container, {
        content: createTranslateResultPanel(holder),
        appendTo: aieContainer,
        placement: "bottom",
        interactive: true,
        trigger: "click",
        arrow: false,
        getReferenceClientRect() {
            return aieContainer.getBoundingClientRect();
        },
        offset: [0, -aieContainer.getBoundingClientRect().height + 100],
        onTrigger: (instance, event) => {
            const lang = event.target && (event.target as HTMLParagraphElement).getAttribute("data-lang");
            if (!lang) {
                instance.disable();
                return
            }
            const textarea = instance.popper.querySelector("textarea");
            textarea!.value = "";
            holder.translatePanelInstance?.hide()
            startChat(holder, lang!, textarea!);
        },
        onUntrigger: (instance) => {
            instance.enable();
        },
    });

    return container;
}


export const Translate = {
    id: "translate",
    title: "translate",
    icon: `<div style="display: flex;height: 20px">
                      <div style="width: 18px;height: 18px;display: inline-block" >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 15V17C5 18.0544 5.81588 18.9182 6.85074 18.9945L7 19H10V21H7C4.79086 21 3 19.2091 3 17V15H5ZM18 10L22.4 21H20.245L19.044 18H14.954L13.755 21H11.601L16 10H18ZM17 12.8852L15.753 16H18.245L17 12.8852ZM8 2V4H12V11H8V14H6V11H2V4H6V2H8ZM17 3C19.2091 3 21 4.79086 21 7V9H19V7C19 5.89543 18.1046 5 17 5H14V3H17ZM6 6H4V9H6V6ZM10 6H8V9H10V6Z"></path></svg>
                      </div>
                     <div style="width: 18px;height: 18px;display: inline-block" >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 14L8 10H16L12 14Z"></path></svg>
                     </div>
                 </div>
                `,
    onInit: ({innerEditor}, tippyInstance, parentEle) => {
        const holder: Holder = {editor: innerEditor, tippyInstance};
        const translateMenuItems = innerEditor.aiEditor.options.ai?.translate?.translateMenuItems || defaultTranslateMenuItems;
        holder.translatePanelInstance = tippy(parentEle.querySelector("#translate")!, {
            content: createTranslatePanelElement(holder, translateMenuItems),
            appendTo: innerEditor!.view.dom.closest(".aie-container")!,
            placement: "bottom",
            trigger: 'click',
            interactive: true,
            arrow: false,
        })
        return holder;
    },
} as BubbleMenuItem
