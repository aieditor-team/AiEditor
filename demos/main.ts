// @ts-ignore
import {AiEditor} from "../src/core/AiEditor.ts";
import {config} from "./xinghuo";

new AiEditor({
    element: "#aiEditor",
    placeHolder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。输入 空格 + "/" 可以快速弹出 AI 菜单哦 ',
    ai: {
        model: {
            xinghuo: {
                ...config
            }
        }
    },
    onMentionQuery:(query)=>{
        return [
            'Michael Yang', 'Jean Zhou', 'Tom Cruise', 'Madonna', 'Jerry Hall', 'Joan Collins', 'Winona Ryder'
            , 'Christina Applegate', 'Alyssa Milano', 'Molly Ringwald', 'Ally Sheedy', 'Debbie Harry', 'Olivia Newton-John'
            , 'Elton John', 'Michael J. Fox', 'Axl Rose', 'Emilio Estevez', 'Ralph Macchio', 'Rob Lowe', 'Jennifer Grey'
            , 'Mickey Rourke', 'John Cusack', 'Matthew Broderick', 'Justine Bateman', 'Lisa Bonet',
        ].filter(item => item.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)

    }
})
