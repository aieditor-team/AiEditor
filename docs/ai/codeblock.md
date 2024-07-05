# Code Block AI Configuration

In the code component, there are two AI functionalities related to  `"AI comment" ` and `"AI code explain" `. As shown in the following image:

![](../assets/image/codeblock-ai-en.png)

## Sample

The above functions need to be configured for AI, and the configuration code is as follows:

```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        codeBlock: {
            codeComments: {
                model:"auto",
                prompt:"Help me add some comments to this code, and return the code with comments added. Only return the code.",
            },
            codeExplain: {
                model:"auto",
                prompt:"Help me explain this code, providing an explanation of what the code does. Note that there's no need to explain the comments in the code.",
            }
        }
    },
})
```

- model: Refers to which large model to use.
- prompt: The prompt content for the large model.