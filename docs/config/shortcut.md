# Shortcut keys

AIEditor provides many shortcut keys for operating the document.

## `CTRL + S` Save

During the editing process, users may be accustomed to pressing `ctrl + s` (`command + s` for Mac computers) to save user documents. We can configure `onSave`
to listen to the user's save button, and then perform our own save logic operation.

As shown in the following code:

```ts
new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to enter content...",
    onSave:(editor: AiEditor)=>{
        //Save logic operation here
    }
})
```