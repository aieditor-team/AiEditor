# AiEditor integrates with Vue2

In Vue, we use `div` a reference from a `ref` `$refs` property definition and then instantiate with `new AiEditor` , as shown in the sample code:

```html
<template>
    <div>
        <h1>AiEditor is an Open Source Rich Text Editor Designed for AI. </h1>
    </div>
    <div ref="divRef" style="height: 600px"/>
</template>

<script lang="ts">
    import {AiEditor} from "aieditor";
    import "aieditor/dist/style.css"
    export default {
        mounted(){
            new AiEditor({
                element: this.$refs.divRef as Element,
                placeholder: "Click to Input Content...",
                content: 'AiEditor is an Open Source Rich Text Editor Designed for AI.  ',
            })
        }
    }
</script>
```

**Note! Note! Note!** In the process of integrating with vue2, many students may have two solutions to this problem due to the low `Compilation Error` version of vue2:

**Scenario 1**: Modify `tsconfig.json` the `esnext` configuration `es2018` of as follows:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "es2018"
    // Other Configurations...
  }
  // Other Configurations...
}
```

** Scenario 2:**  Upgrade Vue2 to Vue 2.7 or later.