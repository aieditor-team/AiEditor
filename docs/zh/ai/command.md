#  AI 命令配置（Command）

AI Command，指的是在文本框中，输入 `空格 + '/'` 弹出的 AI 菜单。

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
        commands:[
            {
                name: "AI 续写",
                prompt: "请帮我继续扩展一些这段话的内容",
                model: "spark",
            },
            {
                name: "AI 提问",
                prompt: "",
                model: "spark",
            },
        ]
    },
})
```

- **name**：AI 菜单的名称
- **prompt**：AI 提示语
- **model**：使用的 AI 大模型，目前支持 `spark` (星火大模型)、`wenxin`（文心一言）以及 `custom`（自定义类型），来未来会支持文心一言、ChatGPT 等多模型共存。

**注意：** 当 `model` 未配置，或者配置为 "`auto`" 时，会自动选择第一个配置的大语言模型。

