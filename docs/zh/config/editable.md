# 编辑器的只读模式

在某些场景下，我们可能需要用到编辑器的只读模式，方便还原 html 的样式或者格式等。

## 示例代码

方案 1： 在初始化时，通过传入 ` editable:false` 参数进行设置：

```typescript 5
new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
    editable:false,
})
```

方案 2： 通过调用 `aiEditor.setEditable(false)` 进行设置：

```typescript 8
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
})


aiEditor.setEditable(false)
```