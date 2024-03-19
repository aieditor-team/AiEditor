import {AiEditor} from "../../../src";
import {config} from "./xinghuo.ts"
// import {AiMessage} from "../../../src/ai/core/AiMessage.ts";

const content = `
{"type":"doc","content":[{"type":"paragraph","attrs":{"lineHeight":"100%","textAlign":"left","indent":0},"content":[{"type":"text","text":"AiEditor 是一个面向 AI 的下一代富文本编辑器。"}]},{"type":"paragraph","attrs":{"lineHeight":"100%","textAlign":"left","indent":0},"content":[{"type":"text","marks":[{"type":"bold"}],"text":"提示："},{"type":"text","text":" "}]},{"type":"orderedList","attrs":{"tight":true,"start":1},"content":[{"type":"listItem","attrs":{"indent":0},"content":[{"type":"paragraph","attrs":{"lineHeight":"100%","textAlign":"left","indent":0},"content":[{"type":"text","text":"输入 空格 + \\"/\\" 可以快速弹出 AI 菜单 "}]}]},{"type":"listItem","attrs":{"indent":0},"content":[{"type":"paragraph","attrs":{"lineHeight":"100%","textAlign":"left","indent":0},"content":[{"type":"text","text":"输入 空格 + \\"@\\" 可以提及某人"}]}]}]},{"type":"paragraph","attrs":{"lineHeight":"100%","textAlign":"left","indent":0}},{"type":"paragraph","attrs":{"lineHeight":"100%","textAlign":"left","indent":0},"content":[{"type":"text","text":"请使用 Java 帮我写一个 hello world，只需要返回 java 代码内容"}]},{"type":"codeBlock","attrs":{"language":"java"},"content":[{"type":"text","text":"public class HelloWorld {\\n    public static void main(String[] args) {\\n        System.out.println(\\"Hello, World!\\");\\n    }\\n}"}]},{"type":"paragraph","attrs":{"lineHeight":"100%","textAlign":"left","indent":0}}]}
`
// @ts-ignore
window.aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    contentRetention: true,
    content: JSON.parse(content),
    ai: {
        models: {
            spark: {
                ...config
            }
            // custom: {
            //     url: "http://127.0.0.1:8080/api/v1/ai/chat",
            //     messageWrapper: (message: string) => {
            //         return JSON.stringify({prompt: message})
            //     },
            //     messageParser: (message: string) => {
            //         return {
            //             role: "assistant",
            //             content: message,
            //             // index: number,
            //             // //0 代表首个文本结果；1 代表中间文本结果；2 代表最后一个文本结果。
            //             // status: 0|1|2,
            //         }
            //     },
                // protocol: "sse" | "websocket"
            // }
        },
    },
    onMentionQuery: (query: string) => {
        return [
            'Michael Yang', 'Jean Zhou', 'Tom Cruise', 'Madonna', 'Jerry Hall', 'Joan Collins', 'Winona Ryder'
            , 'Christina Applegate', 'Alyssa Milano', 'Molly Ringwald', 'Ally Sheedy', 'Debbie Harry', 'Olivia Newton-John'
            , 'Elton John', 'Michael J. Fox', 'Axl Rose', 'Emilio Estevez', 'Ralph Macchio', 'Rob Lowe', 'Jennifer Grey'
            , 'Mickey Rourke', 'John Cusack', 'Matthew Broderick', 'Justine Bateman', 'Lisa Bonet',
        ].filter(item => item.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
    }
})
