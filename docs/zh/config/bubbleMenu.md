# 浮动菜单

浮动菜单指的是当用户选择一段文字时，弹出的 UI 菜单，如下图所示：
![](../../assets/image/bubble-menu.png)

## 菜单配置

在 AIEditor 中，我们可以通过 `textSelectionBubbleMenu` 来配置浮动菜单，示例代码如下：

```typescript
new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
    textSelectionBubbleMenu: {
        enable: true,
        items: ["ai", "Bold", "Italic", "Underline", "Strike", "code", "comment"],
    },
})
```

- **enable**： 是否启用
- **items**： 浮动菜单的菜单项（配置不区分大小写）

> 注意：以上 **items** 的 "comment" 的配置，只有 Pro 版本支持（开源版暂不支持）。