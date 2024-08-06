# 代码块配置

## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    codeBlock: {
        languages: [
            {name: 'Auto', value: 'auto'},
            {name: 'Plain Text', value: 'plaintext', alias: ['text', 'txt']},
            {name: 'Bash', value: 'bash', alias: ['sh']},
            {name: 'BASIC', value: 'basic', alias: []},
            {name: 'C', value: 'c', alias: ['h']},
            {name: 'Clojure', value: 'clojure', alias: ['clj', 'edn']},
            {name: 'CMake', value: 'cmake', alias: ['cmake.in']},
        ],
        codeExplainPrompt: "帮我对这个代码进行解释，返回代码的解释内容，注意，不需要对代码的注释进行解释",
        codeCommentsPrompt: "帮我对这个代码添加一些注释，并返回添加注释的代码，只返回代码",
    },
})
```

- **languages**: 高亮代码支持的语言配置
- **codeExplainPrompt**: “代码解释” 功能对应的大语言模型提示词
- **codeCommentsPrompt**:  “自动注释” 功能对应的大语言模型提示词


