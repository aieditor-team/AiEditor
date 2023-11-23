# 提及

**提及** 指的是用户在编辑器中，输入 `空格 + '@'` 弹出的类似微博的 `@某某某` 的功能。

## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    onMentionQuery:(query:string)=>{
        return [
            'Lea Thompson',
            'Cyndi Lauper',
            'Tom Cruise',
            'Madonna',
            'Jerry Hall',
            'Joan Collins',
            'Winona Ryder',
            'Christina Applegate',
            'Alyssa Milano',
            'Molly Ringwald',
            'Ally Sheedy',
            'Debbie Harry',
            'Olivia Newton-John',
            'Elton John',
            'Michael J. Fox',
            'Axl Rose',
            'Emilio Estevez',
            'Ralph Macchio',
            'Rob Lowe',
            'Jennifer Grey',
            'Mickey Rourke',
            'John Cusack',
            'Matthew Broderick',
            'Justine Bateman',
            'Lisa Bonet',
        ]
        .filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 5)
    },
})
```

当用户在编辑器输入 `@` 符号时，AiEditor 会自动调用 `onMentionQuery` 方法获取用户列表，
参数 `query` 表示用户输入的内容，例如用户输入 `@michael` ，此时，`query` 的值为 `michael`。
