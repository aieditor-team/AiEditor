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
        model: {
            xinghuo: {
                appId: "***",
                apiKey: "***",
                apiSecret: "***",
            }
        }
    }
})
```

## 传统开发模式

传统开发模式分为 2 步：

- 1、通过 `link` 导入 aieditor 的样式
- 2、通过 `<script type="module">` 初始化 AiEditor 实例

代码如下所示：

```html
<!doctype html>
<html lang="en">
<head>
    <title>AiEditor Demo</title>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <link type="text/css" rel="stylesheet" href="./aieditor/style.css">
    <script type="module">
        import {AiEditor} from './aieditor/index.es.js'
        new AiEditor({
            element: "#aiEditor",
            placeholder: "点击输入内容...",
            content: 'AiEditor 是一个面向 AI 的下一代富文本编辑器。',
            ai: {
                model: {
                    xinghuo: {
                        appId: "***",
                        apiKey: "***",
                        apiSecret: "***",
                    }
                }
            },
        })
    </script>
</head>
<body>

<div id="aiEditor" style="height: 550px;  margin: 20px"></div>

</body>
</html>

```