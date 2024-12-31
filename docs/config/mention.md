# mention

**Mention** refers to the function in the editor where typing a `space + '@'` brings up a list of options similar to the '@someone' feature on social media.

## Samples

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


When the user types the `@` symbol in the editor, AiEditor will automatically call the `onMentionQuery` method to retrieve the user list. The parameter `query` represents the content entered by the user, for example, if the user types `@michael`, the value of `query` will be `michael`.


## Return Promise

In addition, `onMentionQuery` also supports Promise return values, for example:

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

## Return nickname and user ID

You can return an object containing label and id fields, for example:

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

At this time, read the html content, the html content of the `@XXX` tag is as follows:

```html
<span class="mention"
      data-type="mention"
      data-id="4"
      data-label="Madonna">@Madonna</span>
```
