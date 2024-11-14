# Basic configuration

## Samples

```typescript
new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    theme: "light",
    content: 'AiEditor is an Open Source Rich Text Editor Designed for AI. ',
    contentIsMarkdown: false,
    contentRetention: true,
    contentRetentionKey: 'ai-editor-content',
    draggable: true,
    pasteAsText: false,
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


- **element**: The DOM node mounted by the editor, which can be a node description of the string type, such as `#editor` or  `.editor`, or a DOM node object.
- **placeholder**: A placeholder that appears when the editor has nothing to offer.
- **theme**: The theme can be configured as "light" or "dark", and the default is the light theme.
- **content**: The content of the edit.
- **contentIsMarkdown**: Whether the initialized content is markdown content. If so, you need modify this value to `true`.
- **contentRetention**: Whether to automatically save (cache) the currently edited content, which is set to the following `false` by default.
- **contentRetentionKey**: The key value localStorage that is automatically saved (cached) to , defaults to: `ai-editor-content` .
- **draggable**: Whether the editor can be resized by dragging the lower right corner.
- **pasteAsText**: When pasting, paste as text. When set to `true`, the pasted web page content automatically clears the color, link, font, font size, bold, strikethrough and other styles.
- **textCounter**: Text counter, used to display the current amount of text in the lower right corner. You can customize the counting algorithm here.
- **AI**: For more information about AI-related configurations, see [AI Configuration](/zh/ai/base.md).

> Note: Starting from v1.2.0, if the initialized content is `markdown` content, you need to add the `contentIsMarkdown:true` configuration at the same time.
