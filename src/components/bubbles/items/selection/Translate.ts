import {BubbleMenuItem, TranslateMenuItem} from "../../types.ts";
import {t} from "i18next";
import {InnerEditor} from "../../../../core/AiEditor.ts";
import {AiModelManager} from "../../../../ai/AiModelManager.ts";
import {AiClient} from "../../../../ai/core/AiClient.ts";
import tippy, {Instance} from "tippy.js";


type Holder = {
    editor?: InnerEditor,
    translatePanelInstance?: Instance,
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

const startChat = (holder: Holder, lang: string) => {
    if (holder.aiClient) {
        holder.aiClient.stop();
    } else {
        const {selection, doc} = holder.editor!.state
        const selectedText = doc.textBetween(selection.from, selection.to);
        let prompt = holder.editor?.aiEditor.options.ai?.translate?.prompt?.(lang, selectedText);
        if (!prompt) {
            prompt = `请帮我把以下内容翻译为: ${lang}，并返回翻译结果。注意：只需要翻译的结果，不需要解释！您需要翻译的内容是：\n${selectedText}`
        }
        const aiModel = AiModelManager.get("auto");
        if (aiModel) {
            aiModel.chat(selectedText, prompt, {
                onStart(aiClient) {
                    holder.aiClient = aiClient;
                },
                onStop() {
                    holder.aiClient = undefined;
                },
                onMessage(message) {
                    holder.editor?.commands.insertContent(message.content);
                }
            })
        } else {
            console.error("AI model name config error.")
        }
    }
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

    container.querySelectorAll(".aie-translate-panel-body p").forEach((element) => {
        const lang = element.getAttribute("data-lang")!;
        element.addEventListener("click", () => {
            holder.translatePanelInstance?.hide()
            startChat(holder, lang);
        })
    })

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
            // trigger: 'click',
            interactive: true,
            arrow: false,
        })
        return holder;
    },
} as BubbleMenuItem