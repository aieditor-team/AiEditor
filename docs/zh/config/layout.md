# 自定义布局

默认情况下，AiEditor 在初始化的时候，会创建编辑器的头部菜单、编辑区域以及底部的字数显示区域。
如下图所示：

![](../../assets/image/aieditor-areas.png)

## 默认示例

以上截图的初始化代码如下：

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
        })
    </script>
</head>
<body>

<div id="aiEditor" style="height: 550px;  margin: 20px"></div>

</body>
</html>
```

## 自定义布局

在某些场景下，我们想自定义整个 UI 布局，比如：类腾讯文档风格（演示地址： http://aieditor1.jpress.cn ），又或者其他自定义布局形式。
我们可以通过 AiEditor 自定义的 UI 来实现。



示例代码如下：

```html 20-24
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
        })
    </script>
</head>
<body>

<div id="aiEditor" style="height: 550px;  margin: 20px">
    <div class="aie-container">
        <div class="aie-container-header"></div>
        <div class="aie-container-main"></div>
        <div class="aie-container-footer"></div>
    </div>
</div>

</body>
</html>
```

在以上的代码中，相比默认代码，多出了一个类名为 `aie-container` 的 `div` 及其 `3` 个子 `div`，子 `div` 的作用如下：
- `aie-container-header` 用于填充头部的菜单内容
- `aie-container-main` 用于填充中间编辑区域
- `aie-container-footer` 用于填充底部内容

这 `3` 个子 `div` 的顺序、位置、结构、包裹深度等可以进行任何的改变以及布局。但是他们都必须被包裹在类名 `aie-container` 的 `div` 中。
这样，我们就可以实现了自己想要的任何布局。