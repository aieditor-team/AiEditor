# AiEditor integrates with Svelte


In Svelte, the sample code for using AIEditor is as follows:


```html
<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import "aieditor/dist/style.css"
    import type {AiEditor} from "aieditor";

    let aieditor: AiEditor;
    onMount(async () => {
        import('aieditor').then(({AiEditor}) => {
            aieditor = new AiEditor({
                element: "#editor",
                placeholder: "Click to Input Content...",
                content: 'AiEditor is an Open Source Rich Text Editor Designed for AI. ',
            })
        })
    });

    onDestroy(() => {
        aieditor && aieditor.destroy();
    });
</script>

<svelte:head>
    <title>AIEditor Demo for Svelte</title>
</svelte:head>

<div>
    <h1>AIEditor Demo for Svelte</h1>
    <div id="editor"></div>
</div>

<style>
    #editor {
        height: 600px;
    }
</style>
```

The code is at： https://github.com/aieditor-team/AiEditor/tree/main/demos/svelte-ts