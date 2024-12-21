#  Command

AI Command refers to the AI menu that `space + '/'` pops up by typing in the text box.

## Sample

```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        models:{
            openai: {
                apiKey: "sk-alQ96zbDn*****",
                model:"gpt-4o",
            }
        },
        commands:[
            {
                name: "AI Continuation Writing",
                prompt: "Please help me further expand on this passage.",
            },
            {
                name: "AI Inquiry",
                prompt: "...",
            },
        ]
    },
})
```


commands configures the AI menu and supports the following parameters:

- **icon**: icon of the AI enu
- **name**: name of the AI menu
- **prompt**: AI prompt
- **text**: "selected" | "focusBefore" optional, represents the selected text, or the text before the cursor
- **model**: the AI large model used. When `model` is not configured or configured as "`auto`", the first configured large language model will be automatically selected.
- **onClick**: click event callback function, only used for custom functions.

