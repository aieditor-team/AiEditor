# 样式主题

在 AIEditor 中，我们提供了亮色主题和暗色主题。

## 亮色主题
默认情况下，AIEditor 使用亮色主题。

```typescript 5
new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
    // theme: "light",
})
```

## 暗色主题

可以通过配置 `theme: "dark"` 来启用暗色主题。

```typescript 5
new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
    theme: "dark",
})
```

## 切换主题

```typescript 5
const eidtor = new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
})

//若当前主题为亮色，则切换为暗色，若为暗色，则切换为亮色。
editor.changeTheme()

//切换为暗色
editor.changeTheme("dark")

//切换为亮色
editor.changeTheme("light")
```

## 自定义主题颜色

目前，AIEditor 支持自定义的亮色值变量如下：

```css
  //aieditor
  --aie-bg-color: #fff;
  --aie-border-color: #eee;
  --aie-text-color: #333;
  --aie-text-placeholder-color: #adb5bd;


  //buttons
  --aie-button-bg-color: #fafafa;
  --aie-button-border-color: #eee;
  --aie-button-hover-bg-color: #eee;
  --aie-button-hover-border-color: #ccc;

  //inputs
  --aie-input-bg-color:#fff;
  --aie-input-border-color:#e9e9e9;
  --aie-input-focus-bg-color:#fff;
  --aie-input-focus-border-color:#e9e9e9;


  //popover
  --aie-popover-bg-color:#fff;
  --aie-popover-border-color:#e9e9e9;
  --aie-popover-title-color:#666;
  --aie-popover-selected-color:#eee;


  //menus
  --aie-menus-text-color: var(--aie-text-color);
  --aie-menus-bg-color: #ffffff;
  --aie-menus-svg-color: #333;
  --aie-menus-item-hover-color: #eee;
  --aie-menus-divider-color: #eaeaea;
  --aie-menus-ai-bg-color: var(--aie-menus-svg-color);
  --aie-menus-ai-color: #ffffff;
  --aie-menus-tip-bg-color: #333;
  --aie-menus-tip-text-color: #eee;
  --aie-menus-table-cell-border-color: #ccc;
  --aie-menus-table-cell-border-active-color: #000;


  //contents
  --aie-content-pre-bg-color: #f6f6f7;
  --aie-content-blockquote-bg-color: #f6f6f7;
  --aie-content-blockquote-border-color: #e3e3e3;
  --aie-content-blockquote-text-color: #888888;
  --aie-content-container-info-color: #eff1f3;
  --aie-content-container-warning-color: #fcf5e4;
  --aie-content-container-danger-color: #ffe7ea;
  --aie-content-table-th-bg-color: #efefef;
  --aie-content-table-selected-bg-color: rgba(200,200,255,0.3);
  --aie-content-table-border-color: #ced4da;
  --aie-content-table-handler-color: #adf;
  --aie-content-scrollbar-track-piece:#f1f1f1;
  --aie-content-scrollbar-thumb:#c1c1c1;
  --aie-content-scrollbar-thumb-hover:#a9a9a9;
  --aie-content-scrollbar-thumb-active:#787878;
  --aie-content-link-a-color:blue;
  --aie-content-link-a-hover-color:red;
  --aie-content-link-a-visited-color:purple;
  --aie-content-link-a-active-color:green;
```

当我们想修改颜色值时，可以在我们的自定义的 css 文件里添加相关的颜色值，例如：

```css
.my-editor .aie-theme-light {
    --aie-bg-color: #fff;
    --aie-border-color: #eee;
    --aie-text-color: #333;
    --aie-text-placeholder-color: #adb5bd;
}
```

初始化 AIEditor 的代码如下：

>需要在 AIEditor 初始化 div 外部包裹一个类名为 `my-editor` 的 div。

```html 14-16
<!doctype html>
<html lang="en">
<head>
    <title>AiEditor Demo</title>
    <link type="text/css" rel="stylesheet" href="aieditor/style.css">
    <script type="module">
        import {AiEditor} from 'aieditor/index.js'
        new AiEditor({
            element: "#aiEditor",
        })
    </script>
</head>
<body>
<div class="my-editor">
    <div id="aiEditor" style="height: 550px;  margin: 20px"></div>
</div>
</body>
</html>
```
