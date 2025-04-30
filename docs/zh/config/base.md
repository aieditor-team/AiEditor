# 基础配置

## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    theme: "light",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
    contentIsMarkdown: false,
    contentRetention: true,
    contentRetentionKey: 'ai-editor-content',
    draggable: true,
    htmlPasteConfig:{
      pasteAsText: false,
    },
    textCounter: (text: string) => number,
    ai: {
        models: {
            spark: {
                appId: "***",
                apiKey: "***",
                apiSecret: "***",
            }
        }
    }
})
```

- **element**：编辑器挂载的 dom 节点，可以是 string 类型的节点描述，比如 `#editor` 或者 `.editor` 等，也可以是一个 dom 节点对象。
- **placeholder**：占位符，当编辑器没有任何内容时显示。
- **theme**：主题，支持配置为 "light"（亮色） 或者 "dark"（暗色），默认为亮色主题。
- **content**：编辑的内容。
- **contentIsMarkdown**：初始化的内容，是否是 markdown 内容，若是，许修改此项为 `true`。
- **contentRetention**：是否自动保存（缓存）当前编辑的内容，默认为：`false`。
- **contentRetentionKey**：自动保存（缓存）到 `localStorage` 的 key 值，默认为：`ai-editor-content`。
- **draggable**：是否可以通过在右下角拖动调整编辑器的大小。
- **pasteAsText**：粘贴时，以文本方式进行粘贴，设置为 `true` 时，粘贴网页内容自动清除颜色、链接、字体、字号、加粗、删除线等样式。
- **textCounter**：文本计数器，用于在右下角显示当前文本的数量，可以在这里自定义计数算法。
- **ai**: AI 相关配置，更多参考 [AI配置](/zh/ai/base.md) 的相关文档。

> 注意：从 v1.2.0 开始，如果初始化的内容是 `markdown` 内容，需要同时添加 `contentIsMarkdown:true` 配置。
