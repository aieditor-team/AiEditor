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
