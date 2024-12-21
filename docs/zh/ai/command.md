#  AI 命令配置（Command）

AI Command，指的是在文本框中，输入 `空格 + '/'` 弹出的 AI 菜单。

## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        models:{
            openai: {
                apiKey: "sk-alQ96zbDn*****",
                model:"gpt-4o",
            }
        },
        commands:[
            {
                name: "AI 续写",
                prompt: "请帮我继续扩展一些这段话的内容",
            },
            {
                name: "AI 提问",
                prompt: "...",
            },
        ]
    },
})
```
commands 配置的是 AI 菜单，支持以下参数：

- **icon**：AI 菜单的 icon 图标
- **name**：AI 菜单的名称
- **prompt**：AI 提示语
- **text**："selected" | "focusBefore" 可选，代表选中的文本，或者光标前的文本
- **model**：使用的 AI 大模型，当 `model` 未配置，或者配置为 "`auto`" 时，会自动选择第一个配置的大语言模型。
- **onClick**：点击事件回调函数，只用于自定义功能时使用。


