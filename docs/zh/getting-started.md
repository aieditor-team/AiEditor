# 快速开始


## 现代开发模式

安装：

```shell
npm i aieditor
```

使用：

```typescript
new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
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


