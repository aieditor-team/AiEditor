# AI 配置


## 基础配置

```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        model:{
            xinghuo:{
                appId:"****",
                apiKey:"****",
                apiSecret:"****"
            }
        }
    },
})
```

- **model**: 模型配置（目前暂时只支持科大讯飞的星火大模型）
- **xinghuo**: 星火大模型配置，星火大模型支持配置的内容如下：

```typescript
protocol?: string,
appId: string,
apiKey?: string,
apiSecret?: string,
version?: string,
urlSignatureAlgorithm?:(model:XingHuoModel)=>string,
```
- **protocol**：通信协议，支持 ws 和 wss。
- **appId**：应用 ID。
- **apiKey**：api Key。
- **apiSecret**：api 秘钥。
- **version**: 版本，默认为 v3.1。
- **urlSignatureAlgorithm**: 自定义 URL 签名算法，一般情况下，如果编辑器涉及内容对外开放，则需要配置 urlSignatureAlgorithm，用于通过 server 端对 url 签名生成通信 url。

## AI 菜单配置


```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        model:{
            xinghuo:{
                appId:"****",
                apiKey:"****",
                apiSecret:"****"
            }
        },
        menus:[
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M4 18.9997H20V13.9997H22V19.9997C22 20.552 21.5523 20.9997 21 20.9997H3C2.44772 20.9997 2 20.552 2 19.9997V13.9997H4V18.9997ZM16.1716 6.9997L12.2218 3.04996L13.636 1.63574L20 7.9997L13.636 14.3637L12.2218 12.9495L16.1716 8.9997H5V6.9997H16.1716Z"></path></svg>`,
                name: "AI 续写",
                prompt: "请帮我继续扩展一些这段话的内容",
                text: "focusBefore",
                model: "xinghuo",
            },
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15 5.25C16.7949 5.25 18.25 3.79493 18.25 2H19.75C19.75 3.79493 21.2051 5.25 23 5.25V6.75C21.2051 6.75 19.75 8.20507 19.75 10H18.25C18.25 8.20507 16.7949 6.75 15 6.75V5.25ZM4 7C4 5.89543 4.89543 5 6 5H13V3H6C3.79086 3 2 4.79086 2 7V17C2 19.2091 3.79086 21 6 21H18C20.2091 21 22 19.2091 22 17V12H20V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z"></path></svg>`,
                name: "AI 优化",
                prompt: "请帮我优化一下这段文字的内容，并返回结果",
                text: "selected",
                model: "xinghuo",
            },
        ]
    },
})
```

- icon：用于菜单显示的 icon
- name：AI 菜单的名称
- prompt：AI 提示语
- text：文字内容，支持 `"focusBefore"` 和 `"selected"` 可选；`"focusBefore"` 表示获取当前焦点前的文字内容，`"selected"` 表示获取当前选中的文本内容。
- model：使用的 AI 大模型，目前暂时只支持 xinghuo (星火大模型)，来未来会支持文心一言、ChatGPT 等多模型共存。


## AI Command 配置

AI Command，指的是在文本框中，输入 `空格 + '/'` 弹出的 AI 菜单。


```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        model:{
            xinghuo:{
                appId:"****",
                apiKey:"****",
                apiSecret:"****"
            }
        },
        commands:[
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
        ]
    },
})
```

- name：AI 菜单的名称
- prompt：AI 提示语
- model：使用的 AI 大模型，目前暂时只支持 xinghuo (星火大模型)，来未来会支持文心一言、ChatGPT 等多模型共存。

