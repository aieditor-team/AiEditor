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
        defaultType: "warning",
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
        typeItems: [ "default", 'info','warning','danger',]
    },
})
```
以上代码中，配置了 4 种类型的高亮块，分别为 `default`、 `info`、`warning`、`danger`。此时，我们输入 `:::default`，然后输入回车，即可添加 `default` 类型的高亮块。

在以上的代码中，虽然我们新增了 “default” 类型，但是，该类型不会有任何的样式，我们还需要在外部添加如下的 css 代码：

```css
/* 以下的 div.default 中的 default 为我们新增的名称*/
.aie-container div.default{
    background: #fafafa;
}
```

或者，在暗色和亮色主题下定义不同的颜色：

```css
.aie-theme-light {
    --my-default-color: #fafafa;
}

.aie-theme-dark {
    --my-default-color: #333;
}

.aie-container div.default{
    background: var(--my-default-color);
}
```



## 其他事项

当使用 `aieditor.getMarkdown()` 方法获取 Markdown 内容时，AIEditor 会自动将高亮块转换为 Markdown 语法。

例如：

```markdown
::: warning
This is a warning.
:::
```

