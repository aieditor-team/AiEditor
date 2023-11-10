// @ts-ignore
import {AiEditor} from "../src/core/AiEditor.ts";
import {config} from "./xinghuo";

new AiEditor({
    element: "#aiEditor",
    placeHolder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。',
    ai: {
        model: {
            xinghuo: {
                ...config
            }
        }
    }
})
