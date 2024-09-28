# Paste Config

The paste configuration here can currently only be used to configure the pasting of html content, that is, to process the content copied from the web page.

## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    htmlPasteConfig: {
        pasteAsText: false,
        pasteClean: false,
        pasteProcessor: (html) => {
            return html;
        }
    },
})
```

- **pasteAsText**: remove all non-text content and html tags.
- **pasteClean**: remove all styles and `'a'`, `'span'`, `'strong'`, `'b'`, `'em'`, `'i'`, `'u'` tags.
- **pasteProcessor**: customize to process the html content.