# Quick Start


## Modern Development Mode

Installation：

```shell
npm i aieditor
```

Usage：

```typescript
new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to Input Content...",
    content: 'AiEditor is an Open Source Rich Text Editor Designed for AI. ',
    ai: {
        models: {
            spark: {
                appId: "***",
                apiKey: "***",
                apiSecret: "***",
            }
        }
    }
})
```

