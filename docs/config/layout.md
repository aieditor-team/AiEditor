# Custom layouts

By default, when AiEditor is initialized, it will create the editor's head menu, editing area, and bottom word count display area. As shown in the figure below:

![](../assets/image/aieditor-areas.png)

## Default sample

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
            placeholder: "Click to Input Content...",
            content: 'AiEditor is an Open Source Rich Text Editor Designed for AI.',
        })
    </script>
</head>
<body>

<div id="aiEditor" style="height: 550px;  margin: 20px"></div>

</body>
</html>
```

## Custom layouts


In some scenarios, we may want to customize the entire UI layout, such as adopting a Tencent Docs-style layout (demo link: http://aieditor1.jpress.cn), or other customized layout forms. We can achieve this using AiEditor's customizable UI features.



 The sample code is as follows:

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
            placeholder: "Click to Input Content...",
            content: 'AiEditor is an Open Source Rich Text Editor Designed for AI.',
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


In the provided code, an additional `<div>` with the class name `aie-container` and its three child `<div>` elements have been added compared to the default code. The purpose of these child `<div>` elements is as follows:

- `aie-container-header`: Used to fill the header menu content.
- `aie-container-main`: Used to fill the middle editing area.
- `aie-container-footer`: Used to fill the footer content.

The order, position, structure, and nesting depth of these three child `<div>` elements can be changed in any way to achieve the desired layout. However, they must all be wrapped within a `<div>` with the class name `aie-container`. This allows us to implement any layout we want.