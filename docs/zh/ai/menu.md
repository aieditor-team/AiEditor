# AI 菜单配置

AI 菜单配置，用于在编辑器顶部工具类，点击 AI 下拉的菜单内容。

## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        models:{
            spark:{
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
                model: "spark",
            },
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15 5.25C16.7949 5.25 18.25 3.79493 18.25 2H19.75C19.75 3.79493 21.2051 5.25 23 5.25V6.75C21.2051 6.75 19.75 8.20507 19.75 10H18.25C18.25 8.20507 16.7949 6.75 15 6.75V5.25ZM4 7C4 5.89543 4.89543 5 6 5H13V3H6C3.79086 3 2 4.79086 2 7V17C2 19.2091 3.79086 21 6 21H18C20.2091 21 22 19.2091 22 17V12H20V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z"></path></svg>`,
                name: "AI 优化",
                prompt: "请帮我优化一下这段文字的内容，并返回结果",
                text: "selected",
                model: "spark",
            },
        ]
    },
})
```

- **icon**：用于菜单显示的 icon，暂时只支持 svg 配置，svg icon 建议使用 https://remixicon.com 提供的 icon，以保证和 AiEditor 的 icon 风格保持统一。
- **name**：AI 菜单的名称
- **prompt**：AI 提示语
- **text**：文字内容，支持 `"focusBefore"` 和 `"selected"` 可选；`"focusBefore"` 表示获取当前焦点前的文字内容，`"selected"` 表示获取当前选中的文本内容。
- **model**：使用的 AI 大模型，目前支持 `spark` (星火大模型)、`wenxin`（文心一言）以及 `custom`（自定义类型），来未来会支持文心一言、ChatGPT 等多模型共存。

**注意：** 当 `model` 未配置，或者配置为 "`auto`" 时，会自动选择第一个配置的大语言模型。