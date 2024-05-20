# The editor's read-only mode

In some cases, we may need to use the editor's read-only mode to restore the style or formatting of the HTML.

## Samples

Solution 1: Set `editable:false` parameter during initialization.


```typescript 5
new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    content: 'AiEditor is an Open Source Rich Text Editor Designed for AI. ',
    editable:false,
})
```

Solution 2: Set using `aiEditor.setEditable(false)` method call.

```typescript 8
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    content: 'AiEditor is an Open Source Rich Text Editor Designed for AI. ',
})


aiEditor.setEditable(false)
```