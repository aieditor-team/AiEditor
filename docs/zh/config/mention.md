# 提及

**提及** 指的是用户在编辑器中，输入 `空格 + '@'` 弹出的类似微博的 `@某某某` 的功能。

## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    onMentionQuery: (query: string) => {
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

## 返回 Promise

另外，`onMentionQuery` 也支持 Promise 返回值，例如：

```typescript
onMentionQuery: (query) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const data = [
                'Michael Yang', 'Jean Zhou', 'Tom Cruise', 'Madonna', 'Jerry Hall', 'Joan Collins', 'Winona Ryder'
                , 'Christina Applegate', 'Alyssa Milano', 'Molly Ringwald', 'Ally Sheedy', 'Debbie Harry', 'Olivia Newton-John'
                , 'Elton John', 'Michael J. Fox', 'Axl Rose', 'Emilio Estevez', 'Ralph Macchio', 'Rob Lowe', 'Jennifer Grey'
                , 'Mickey Rourke', 'John Cusack', 'Matthew Broderick', 'Justine Bateman', 'Lisa Bonet',
            ].filter(item => item.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
            resolve(data)
        }, 200)
    })
}
```

## 返回昵称和用户 ID

可以返回一个对象，包含有 label 和 id 字段，例如：

```typescript
onMentionQuery: (query) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const data = [
                {
                    id: 1,
                    label: 'Michael Yang'
                },
                {
                    id: 2,
                    label: 'Jean Zhou'
                },
                {
                    id: 3,
                    label: 'Tom Cruise'
                },
                {
                    id: 4,
                    label: 'Madonna'
                },
                {
                    id: 5,
                    label: 'Jerry Hall'
                }
            ].filter(item => item.name.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
            resolve(data)
        }, 200)
    })
}
```

此时，读取 html 内容下，`@某某` 标签的 html 内容如下：

```html
<span class="mention"
      data-type="mention"
      data-id="4"
      data-label="Madonna">@Madonna</span>
```
