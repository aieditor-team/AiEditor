# AiEditor 与 Vue3 整合


在 Vue 中，我们通过 `ref` 属性定义 `div` 的 `$refs` 引用，然后再通过 `new AiEditor` 进行实例化，示例代码如下：

```html
<template>
    <div>
        <h1>AiEditor，一个面向 AI 的富文本编辑器</h1>
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
                placeholder: "点击输入内容...",
                content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
            })
        }
    }
</script>
```


或者使用 `vue` 的 `setup` 语法：

```vue
<template>
  <div>
    <h1>AiEditor，一个面向 AI 的富文本编辑器</h1>
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
    placeholder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
  })
})

onUnmounted(() => {
  aiEditor && aiEditor.destroy();
})
</script>
```

更多 vue 集成示例请参考：https://gitee.com/aieditor-team/aieditor/tree/main/demos/vue-ts 

## SSR 服务端渲染

关于 SSR 参考文档：https://cn.vuejs.org/guide/scaling-up/ssr.html#server-side-rendering-ssr

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