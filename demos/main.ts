
import {AiEditor} from "../src/core/AiEditor.ts";
import {config} from "./xinghuo";

new AiEditor({
    element:"#zEditor",
    placeHolder:"点击输入内容...",
    content:'通过这里，快速感觉 JPress 的功能和强大，这一切，都试开源、免费、可商用的！',
    ai:{
        model:{
            xinghuo:{
                ...config
            }
        }
    },
    onMentionQuery:(query:string)=>{
        return [query];
    }
})
