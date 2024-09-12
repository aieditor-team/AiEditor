# 行高配置


## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    lineHeight:{
        values:["1.0", "1.1", "2.0", "..."],
    },
})
```
注意：在以上的配置中，必须配置 `"1.0"`,`"1.0"` 是用于取消行高的设置（由外部 css 来决定行高）。
