#  Command

AI Command refers to the AI menu that `space + '/'` pops up by typing in the text box.

## Sample

```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        models:{
            spark:{
                appId:"****",
                apiKey:"****",
                apiSecret:"****"
            }
        },
        commands:[
            {
                name: "AI Continuation Writing",
                prompt: "Please help me further expand on this passage.",
                model: "spark",
            },
            {
                name: "AI Inquiry",
                prompt: "",
                model: "spark",
            },
        ]
    },
})
```


- **name**: Name of the AI menu.
- **prompt**: AI prompt message.
- **model**: AI large model used, currently supports `spark` (Spark large model), `wenxin` (Wenxin Yiyuan), and `custom` (custom type). In the future, it will support multiple models such as Wenxin Yiyuan, ChatGPT, etc.

**Note:** When `model` is not configured or configured as "`auto`", the first configured large language model will be automatically selected.

