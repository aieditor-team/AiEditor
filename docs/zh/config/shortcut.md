# 快捷键

AIEditor 提供了许多快捷键，用于操作当前的文档。


## `CTRL + S` 保存

在用户编辑的过程中，可能会习惯的按 `ctrl + s` (mac 电脑为 `command + s`) 用于保存用户文档，我们可以通过配置 `onSave`
来监听用户的保存按键，然后进行自己的保持逻辑操作。


如下代码所示：

```ts
new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    onSave:(editor: AiEditor)=>{
        //通过这里进行保存的逻辑操作
    }
})
```