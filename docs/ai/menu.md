# AI menu configuration

AI menu configuration, which is used to click on the AI drop-down menu content in the Tools class at the top of the editor.

## Samples

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
        menus:[
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M4 18.9997H20V13.9997H22V19.9997C22 20.552 21.5523 20.9997 21 20.9997H3C2.44772 20.9997 2 20.552 2 19.9997V13.9997H4V18.9997ZM16.1716 6.9997L12.2218 3.04996L13.636 1.63574L20 7.9997L13.636 14.3637L12.2218 12.9495L16.1716 8.9997H5V6.9997H16.1716Z"></path></svg>`,
                name: "AI continues writing",
                prompt: "Please help me further expand on this passage.",
                text: "focusBefore",
                model: "spark",
            },
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15 5.25C16.7949 5.25 18.25 3.79493 18.25 2H19.75C19.75 3.79493 21.2051 5.25 23 5.25V6.75C21.2051 6.75 19.75 8.20507 19.75 10H18.25C18.25 8.20507 16.7949 6.75 15 6.75V5.25ZM4 7C4 5.89543 4.89543 5 6 5H13V3H6C3.79086 3 2 4.79086 2 7V17C2 19.2091 3.79086 21 6 21H18C20.2091 21 22 19.2091 22 17V12H20V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z"></path></svg>`,
                name: "AI 优化",
                prompt: "Please help me optimize the content of this passage and provide the result.",
                text: "selected",
                model: "spark",
            },
        ]
    },
})
```


- **icon**: Icon used for menu display, currently only supports SVG configuration. It's recommended to use SVG icons provided by https://remixicon.com to ensure consistency with AiEditor's icon style.
- **name**: Name of the AI menu.
- **prompt**: AI prompt message.
- **text**: Text content, supports `"focusBefore"` and `"selected"` options; `"focusBefore"` indicates getting the text content before the current focus, `"selected"` indicates getting the currently selected text content.
- **model**: AI large model used, currently supports `spark` (Spark large model), `wenxin` (Wenxin Yiyuan), and `custom` (custom type). In the future, it will support multiple models such as Wenxin Yiyuan, ChatGPT, etc.

**Note:** When `model` is not configured or configured as "`auto`", the first configured large language model will be automatically selected.