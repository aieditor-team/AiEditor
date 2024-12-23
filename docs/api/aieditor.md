# API documentation

## Initialize

AiEditor is the core class of the entire editor, and its initialization code is as follows:

```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
})
```

## Methods

Sample：

```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
})

//Get the editing content and read it as an HTML string.
const html = aiEditor.getHtml();
console.log(html)
```

AiEditor provides the following methods:

- `getHtml()`: Get the HTML content of the current editor.
- `getJson()`: Get the JSON description data of the current editor.
- `getText()`: Get the plain text content (excluding HTML) of the current editor.
- `getSelectedText()`: Get the plain text content (excluding HTML) of the currently selected text in the editor.
- `getMarkdown()`: Get the markdown-formatted content of the current editor.
- `getOptions()`: Get the configuration information of the current editor.
- `getAttributes(name)`： get the properties of the node or mark at the current focus position.
- `getOutline()`: Get the outline of the content, returning an array with the following format:

```json
[
    {
        "id":"aie-heading-1",
        "text":"Installation",
        "level":2,
        "pos":1203,
        "size":4
    },
    {
        "id":"aie-heading-2",
        "text":"Usage",
        "level":2,
        "pos":1229,
        "size":4
    },
    {
        "id":"aie-heading-3",
        "text":"Configuration",
        "level":2,
        "pos":2744,
        "size":4
    }
]
```


In the above outline content, each field's meaning is as follows:
> -text: Directory name (or content)
> -level: Directory level, values range from 1 to 6, corresponding to HTML tags h1 to h6
> -pos: Position of the directory node in the document
> -size: Size of the content of the directory node

- `focus()`: Focus the editor.
- `focusPos(pos)`: Focus on the specified position in the editor.
- `focusStart()`: Focus the editor and set the cursor at the beginning.
- `focusEnd()`: Focus the editor and set the cursor at the end.
- `isFocused()`: Check if the editor is currently focused.
- `blur()`: Blur the editor.
- `insert(content)`: Dynamically insert HTML, text content. **Note:** This method is ineffective when the aiEditor has not gained focus. You can first focus by calling `aiEditor.focus().insert(string)` and then insert content.
- `insertMarkdown(content)`: Dynamically insert markdown content.
- `clear()`: Delete all content in the editor.
- `setEditable(value)`: Set the editing mode of the editor. The value can be true or false.
- `setContent(value)`: Dynamically set the content of the editor, supporting json, html, and text settings.
- `setMarkdownContent(value)`: Dynamically set the content of the editor, supporting the setting of markdown content.
- `clear()`: Delete all content in the editor.
- `isEmpty()`: Check if the editor has any content.
- `removeRetention()`: Remove automatically recorded and saved editing content from the editor.
- `destroy()`: Destroy the current instance, commonly used in React or Vue. It's called when the component is unmounted.
- `changeLang(lang)`: Switch the internationalization language of the current editor. For more information, refer to the 《[Internationalized](../config/i18n.md)》 section in the documentation.


## Listening


## content change
```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    onChange:(aiEditor)=>{
        // When the editor content changes, console.log the editor's HTML content...
        console.log(aiEditor.getHtml())
    }
})
```


### AIEditor get focus

```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    onFocus:(aiEditor)=>{
        console.log("get the focus....")
    }
})
```

### AIEditor Instance Destroy On Blur

```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    onBlur:(aiEditor)=>{
        console.log("blur....")
    }
})
```


### AIEditor Instance Created

```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    onCreated:(aiEditor)=>{
        console.log("AIEditor instance created....")
    }
})
```

### AIEditor Instance Destroy

```typescript
const aiEditor = new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    onDestroy:(aiEditor)=>{
        console.log("AIEditor instance destory....")
    }
})
```
