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

- `getHtml()`： 获取当前编辑器的 html 内容。
- `getJson()`： 获取当前编辑器的 json 描述数据。
- `getText()`： 获取当前编辑器的 纯文本 内容（不包含 html）。
- `getOptions()`： 获取当前编辑器的配置信息。
- `focus()`： 让编辑器获得焦点。
- `focusStart()`： 让编辑器获得焦点，并设置光标在最开始位置。
- `focusEnd()`： 让编辑器获得焦点，并设置光标在最末尾位置。
- `isFocused()`： 检测当前编辑器是否获得焦点。
- `blur()`： 让编辑器失去焦点。
- `insertHtml(string)`： 动态插入 html 内容。**注意：** 当 aiEditor 没有获得焦点时，调用该方法无效，可以通过 `aiEditor.forcus().insert(string)` 先获得焦点后，再插入内容。
- `insertMarkdown(string)`： 动态插入 markdown 内容。**注意：** 当 aiEditor 没有获得焦点时，调用该方法无效，可以通过 `aiEditor.forcus().insertMarkdown(string)` 先获得焦点后，再插入内容。
- `clear()`： 删除编辑器里的所有内容。
- `isEmpty()`： 检查编辑器里是否有内容。
- `removeRetention()`： 移除编辑器自动记录和保存的编辑内容。
- `destroy()`： 销毁当前实例，常用于 react 或者 vue 中，当组件卸载时调用。
- `changeLang(lang)`： 切换当前编辑器的国际化语言，更多参考 《[国际化](../config/i18n.md)》章节。


## 内容变化监听

```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    onChange:(aiEditor)=>{
        // 监听到用编辑器内容发生变化了，控制台打印编辑器的 html 内容...
        console.log(aiEditor.getHtml())
    }
})
```