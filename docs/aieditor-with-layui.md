# AiEditor integrates with traditional frameworks such as Layui and JQuery



AiEditor integrates with traditional development frameworks in 3 steps:

- 1. Download `aieditor` the `js` sum of `css` , download address:https://gitee.com/aieditor-team/aieditor/tree/main/dist.
- 2. Through `aieditor` the `link` `css` imported style file.
- 3. `<script type="module">` Import `js` and initialize `aieditor` `AiEditor` the instance.

The code looks like this:

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
            placeholder: "Click to Input Content...",
            content: 'AiEditor is an Open Source Rich Text Editor Designed for AI.',
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
::: warning
Internet `<script type="module">` Explorer is not supported.
:::