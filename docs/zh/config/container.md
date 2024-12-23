# 高亮块 

高亮块来源于 Markdown 的扩展语法 `:::`，例如

```markdown
::: warning
This is a warning.
:::
```
显示内容如下：

::: warning  This is a warning.

:::


在 AIEditor 中，我们直接输入 `:::warning` 然后输入回车，即可添加高亮块。或者工具栏按钮进行添加，如下图所示：

![](../../assets/image/container.png)

在 AIEditor 中，已经内置了 3 种高亮块，分别是 `info`、`warning`、`danger`

## 默认高亮块配置

默认高亮块配置，是用于点击`工具栏` 的高亮块图标时，使用的高亮块类型。 或者用户只输入 `:::` 然后键入回车键时，默认使用的类型。

```typescript
new AiEditor({
    element: "#aiEditor",
    container: {
        defaultTypeName: "warning",
    }
})
```

设置默认使用 "warning" 类型。

## 自定义高亮块设置

用户可以通过如下代码进行更多的配置：

```typescript
new AiEditor({
    element: "#aiEditor",
    container: {
        typeItems: [
            {
                name: "default",
                lightBgColor: "#fafafa",
                lightBorderColor: "#e0e0e0",
                darkBgColor: "#1e1e1e",
                darkBorderColor: "#303030",
            },
            {
                name: 'info',
                lightBgColor: '#eff1f3',
                lightBorderColor: '#D7DAE0',
                darkBgColor: '#2a2c30',
                darkBorderColor: '#333',
            },
            {
                name: 'warning',
                lightBgColor: '#fcf5e4',
                lightBorderColor: '#D7DAE0',
                darkBgColor: '#40361d',
                darkBorderColor: '#333',
            },
            {
                name: 'danger',
                lightBgColor: '#ffe7ea',
                lightBorderColor: '#D7DAE0',
                darkBgColor: '#46222a',
                darkBorderColor: '#333',
            },
        ]
    },
})
```
以上代码中，配置了 4 种类型的高亮块，分别为 `default`、 `info`、`warning`、`danger`。此时，我们输入 `:::default`，然后输入回车，即可添加 `default` 类型的高亮块。

配置项 `typeItems` 是一个数组，数组中的每个元素都是一个对象，对象中包含以下字段：
- name: 高亮块的名称，用于区分不同的高亮块，必须唯一，且不能为空。
- lightBgColor: 高亮块的背景色，在浅色主题下显示。
- lightBorderColor: 高亮块的边框颜色，在浅色主题下显示。
- darkBgColor: 高亮块的背景色，在深色主题下显示。
- darkBorderColor: 高亮块的边框颜色，在深色主题下显示。

## 其他事项

当使用 `aieditor.getMarkdown()` 方法获取 Markdown 内容时，AIEditor 会自动将高亮块转换为 Markdown 语法。

例如：

```markdown
::: warning
This is a warning.
:::
```

