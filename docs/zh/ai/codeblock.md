# 代码块 AI 配置

在代码编辑器的组件中，有关于 `“AI自动添加注释”` 和 `“AI解释代码含义”` 的两个 AI 功能。如下图所示：

![](../../assets/image/codeblock-ai.png)

## 示例代码

以上功能需要进行对 AI 的进行配置， 配置代码如下：

```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        codeBlock: {
            codeComments: {
                model:"spark",
                prompt:"帮我对这个代码添加一些注释，并返回添加注释的代码，只返回代码",
            },
            codeExplain: {
                model:"spark",
                prompt:"帮我对这个代码进行解释，返回代码的解释内容，注意，不需要对代码的注释进行解释",
            }
        }
    },
})
```

- model: 指的是使用哪个大模型
- prompt: 大模型的 prompt 内容