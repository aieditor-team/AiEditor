# 粘贴配置

这里的粘贴配置，目前暂时只能用于对粘贴 html 内容的配置，也就是通过网页复制进来的内容进行处理。


## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    htmlPasteConfig: {
        pasteAsText: false,
        pasteClean: false,
        clearLineBreaks: true,
        pasteProcessor: (html) => {
            return html;
        }
    },
})
```

- **pasteAsText**: 移除所有的非文本内容以及 html 标签。
- **pasteClean**: 移除所有的内容样式，以及 `'a'`, `'span'`, `'strong'`, `'b'`, `'em'`, `'i'`, `'u'` 标签的修饰。
- **clearLineBreaks**: 移除所有的换行符，默认为 `true`
- **pasteProcessor**: 自定义对 html 内容进行处理。
