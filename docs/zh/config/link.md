# 超链接配置


## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    link: {
        autolink: true,
        rel: "",
        class: "",
        bubbleMenuItems: ["Edit", "UnLink", "visit"],
    }
})
```

- **autolink**: 自动连接
- **rel**: `a` 标签的 `ref` 属性默认值配置
- **class**:  `a` 标签的  `class` 属性默认值配置
- **bubbleMenuItems**:  `a` 标签获得焦点时，其弹出的浮动菜单配置（配置不区分大小写）


