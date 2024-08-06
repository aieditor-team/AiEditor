# CodeBlock configuration

## Sample code

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
        codeExplainPrompt: "Help me explain this code and return the explanation of the code. Note that you do not need to explain the comments of the code.",
        codeCommentsPrompt: "Help me add some comments to this code and return the commented code, return only the code.",
    },
})
```

- **languages**: Language configuration supported by highlighted code
- **codeExplainPrompt**: The LLMs prompt corresponding to the "code explanation" function
- **codeCommentsPrompt**: The LLMs prompt corresponding to the "automatic comment" function