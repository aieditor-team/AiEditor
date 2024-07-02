# AiEditor integrates with Vue3

In Vue, we use `div` a reference from a `ref` `$refs` property definition and then instantiate with `new AiEditor` , as shown in the sample code:

```html
<template>
    <div>
        <h1>AiEditor is an Open Source Rich Text Editor Designed for AI.</h1>
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

Or use `vue` the `setup` syntax:

```vue
<template>
  <div>
    <h1>AiEditor is an Open Source Rich Text Editor Designed for AI. </h1>
  </div>
  <div ref="divRef" style="height: 600px"/>
</template>

<script setup lang="ts">
import {AiEditor} from "aieditor";
import "aieditor/dist/style.css"
import {onMounted, onUnmounted, ref} from "vue";

const divRef = ref();
let aiEditor: AiEditor | null = null;

onMounted(() => {
  aiEditor = new AiEditor({
    element: divRef.value as Element,
    placeholder: "Click to Input Content...",
    content: 'AiEditor is an Open Source Rich Text Editor Designed for AI.  ',
  })
})

onUnmounted(() => {
  aiEditor && aiEditor.destroy();
})
</script>
```

For more examples of Vue integration, please refer to：https://gitee.com/aieditor-team/aieditor/tree/main/demos/vue-ts 


## SSR

Regarding SSR reference documents: https://vuejs.org/guide/scaling-up/ssr.html#server-side-rendering-ssr

```vue
<template>
  <div style="display: block;text-align: start">
    <div ref="divRef" class="aiEditor" style="height: 850px;max-width: 1280px"/>
  </div>
</template>

<script setup lang="ts">
// import {AiEditor} from "aieditor";
import "aieditor/dist/style.css"
import {onMounted, onUnmounted, ref} from "vue";

const divRef = ref();
let aiEditor: any = null;

onMounted(() => {
  //for ssr
  import('aieditor').then(({AiEditor}) => {
    aiEditor = new AiEditor({
      element: divRef.value as Element,
      placeholder: "Click to Input Content...",
      content: 'AiEditor is an Open Source Rich Text Editor Designed for AI.  ',
    })
  })
})

onUnmounted(() => {
  aiEditor && aiEditor.destroy();
})
</script>
```