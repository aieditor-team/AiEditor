# Hyperlink configuration


## Samples

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

- **autolink**: Auto-connect
- **rel**: The default value configuration for the `ref` attribute of the `a` tag.
- **class**:  The default value configuration for the `class` attribute of the `a` tag.
- **bubbleMenuItems**: The bubble menu configuration that pops up when the `a` tag gets the focus (the configuration is not case sensitive)


