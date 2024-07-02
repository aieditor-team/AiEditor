# Bubble menu

The bubble menu refers to the UI menu that pops up when the user selects a piece of text, as shown in the figure below:
![](../assets/image/bubble-menu-en.png)

## Menu configuration

In AIEditor, we can configure the bubble menu through `textSelectionBubbleMenu`, the sample code is as follows:

```typescript
new AiEditor({
    element: "#aiEditor",
    content: 'AiEditor is an open source rich text editor for AI.',
    textSelectionBubbleMenu: {
        enable: true,
        items: ["ai", "Bold", "Italic", "Underline", "Strike", "code", "comment"],
    },
})
```

- **enable**: Whether to enable the bubble menu
- **items**: Menu items of the bubble menu (configuration is not case-sensitive)


>Note: The configuration of "comments" for the above ** items ** is only supported in the Pro version (not currently supported in the open source version).