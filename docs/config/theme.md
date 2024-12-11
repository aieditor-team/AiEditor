# Theme

In AIEditor, we provide light theme and dark theme.

## Light Theme
By default, AIEditor uses light theme.

```typescript 5
new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to enter content...",
    content: 'AiEditor is an open source rich text editor for AI. ',
    // theme: "light",
})
```

## Dark theme

You can enable the dark theme by configuring `theme: "dark"`.

```typescript 5
new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to enter content...",
    content: 'AiEditor is an open source rich text editor for AI. ',
    theme: "dark",
})
```

## Change Theme

```typescript 5
const eidtor = new AiEditor({
    element: "#aiEditor",
    placeholder: "Click to enter content...",
    content: 'AiEditor is an open source rich text editor for AI. ',
})

// If the current theme is light, switch to dark; if it is dark, switch to light.
editor.changeTheme()

// Switch to dark
editor.changeTheme("dark")

// Switch to light
editor.changeTheme("light")
```

## Custom theme color

Currently, AIEditor supports the following custom bright color value variables:

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

When we want to modify the color value, we can add the relevant color value in our custom css file, for example:

```css
.my-editor .aie-theme-light {
    --aie-bg-color: #fff;
    --aie-border-color: #eee;
    --aie-text-color: #333;
    --aie-text-placeholder-color: #adb5bd;
}
```

The code to initialize AIEditor is as follows:

>You need to wrap a div with the class name `my-editor` outside the AIEditor initialization div.

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
