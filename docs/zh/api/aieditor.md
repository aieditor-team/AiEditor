# AiEditor API 文档

## 初始化

AiEditor 为整个编辑器的核心类，其初始化代码如下：

```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
})
```

## 方法

AiEditor 提供的方法如下：

- `getHtml() `： 获取当前编辑器的 html 内容。
- `getJson() `： 获取当前编辑器的 json 描述数据。
- `getText() `： 获取当前编辑器的 纯文本 内容（不包含 html）。

## 内容变化监听

```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    onChnage:(aiEditor)=>{
        // 监听到用编辑器内容发生变化了，控制台打印编辑器的 html 内容...
        console.log(aiEditor.getHtml())
    }
})
```