# AI prompt words

## Preface
In AIEditor, `AI menu`, `AI command`, and `AI code block` can all be configured with custom prompt words. For example, the menu configuration is as follows

```ts
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
                name: "AI Continuation",
                prompt: "Please help me expand on this passage.",
                text: "focusBefore",
                model: "spark",
            },
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15 5.25C16.7949 5.25 18.25 3.79493 18.25 2H19.75C19.75 3.79493 21.2051 5.25 23 5.25V6.75C21.2051 6.75 19.75 8.20507 19.75 10H18.25C18.25 8.20507 16.7949 6.75 15 6.75V5.25ZM4 7C4 5.89543 4.89543 5 6 5H13V3H6C3.79086 3 2 4.79086 2 7V17C2 19.2091 3.79086 21 6 21H18C20.2091 21 22 19.2091 22 17V12H20V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z"></path></svg>`,
                name: "AI Optimization",
                prompt: "Please help me optimize the content of this text and return the results",
                text: "selected",
                model: "spark",
            },
        ]
    },
})
```

At this point, the user selects a text in the editor. Assume that the selected text is: "`AIEditor is a good editor`", and then clicks the `AI Optimization` menu.

Then, AIEditor will send the following content to the LLM:

```
AIEditor is a good editor
Please help me optimize the content of this text and return the results
```
And wait for the LLM to response the result, allowing the user to perform subsequent operations. At this point, if the text content selected by the user conflicts with `Please help me optimize the content of this text and return the results`
, or may have additional meanings, the content returned by the LLM may not necessarily be what we want.

## `{content}` placeholder

In order to solve the scenario where the text selected by the user may conflict with the simple prompt definition, AIEditor supports adding a custom placeholder `{content}` in the prompt content.

Suppose our custom prompt is:
```
Please help me optimize the text content and return the result. The text content is:
“{content}”

Note that only English content can be returned, not Chinese content.
```

Then, suppose the user selects the text content of the editor as: "`AIEditor is a good editor`", and then clicks the `AI Optimization` menu, the prompt AIEditor gives to the LLM as follows:

```
Please help me optimize the text content and return the result. The text content is:
“AIEditor is a good editor”

Note that only English content can be returned, not Chinese content.
```

The prompt becomes clearer and easier to use by using the `{content}` placeholder.