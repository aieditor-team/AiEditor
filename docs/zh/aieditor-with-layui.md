# AiEditor 与 Layui、JQuery 等传统框架整合



AiEditor 与传统开发框架集成，分为 3 步：

- 1、下载 `aieditor` 的 `js` 和 `css` ，下载地址： https://gitee.com/aieditor-team/aieditor/tree/main/dist 。
- 2、通过 `link` 导入 `aieditor` 的 `css` 样式文件 。
- 3、通过 `<script type="module">` 导入 `aieditor` 的 `js` , 并初始化 `AiEditor` 实例 。

代码如下所示：

```html
<!doctype html>
<html lang="en">
<head>
    <title>AiEditor Demo</title>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <link type="text/css" rel="stylesheet" href="aieditor/style.css">
    <script type="module">
        import {AiEditor} from 'aieditor/index.js'
        new AiEditor({
            element: "#aiEditor",
            placeholder: "点击输入内容...",
            content: 'AiEditor 是一个面向 AI 的下一代富文本编辑器。',
            ai: {
                models: {
                    spark: {
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

::: warning 注意
使用 `<script type="module">` 的导入方式，不支持 IE 浏览器。
:::
