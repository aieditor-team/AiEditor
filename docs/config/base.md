# Basic configuration

## Samples

```typescript
new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    theme: "light",
    content: 'AiEditor is an Open Source Rich Text Editor Designed for AI. ',
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


- **element**: The DOM node mounted by the editor, which can be a node description of the string type, such as `#editor` or  `.editor`, or a DOM node object.
- **placeholder**: A placeholder that appears when the editor has nothing to offer.
- **theme**: The theme can be configured as "light" or "dark", and the default is the light theme.
- **content**: The content of the edit.
- **contentRetention**: Whether to automatically save (cache) the currently edited content, which is set to the following `false` by default.
- **contentRetentionKey**: The key value localStorage that is automatically saved (cached) to , defaults to: `ai-editor-content` .
- **AI**: For more information about AI-related configurations, see [AI Configuration](/zh/ai/base.md).