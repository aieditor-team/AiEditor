# 基础配置

## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    theme: "light",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
    contentRetention: true,
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
- **contentRetention**：是否自动保存（缓存）当前编辑的内容，默认为：`false`。
- **contentRetentionKey**：自动保存（缓存）到 `localStorage` 的 key 值，默认为：`ai-editor-content`。
- **ai**: AI 相关配置，更多参考 [AI配置](/zh/ai/base.md) 的相关文档。