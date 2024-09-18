# Quick Start


## Modern Development Mode

Installation：

```shell
npm i aieditor
```

Usage：

HTML:

```html
<div id="aiEditor" style="height: 550px;  margin: 20px"></div>
```


Typescript:

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

