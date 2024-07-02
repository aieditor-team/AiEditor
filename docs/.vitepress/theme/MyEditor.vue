<template>
  <div style="display: block;text-align: start">
    <div ref="divRef" class="aiEditor" style="height: 850px;max-width: 1280px"/>
  </div>
</template>

<script setup lang="ts">
// import {AiEditor} from "aieditor";
import "aieditor/dist/style.css"
import {onMounted, onUnmounted, ref} from "vue";


const {lang} = defineProps(['lang'])
const divRef = ref();
let aiEditor: any = null;

onMounted(() => {
  //for ssr
  import('aieditor').then(({AiEditor}) => {
    aiEditor = new AiEditor({
      element: divRef.value as Element,
      placeholder: "Click to Input Content...",
      content: 'AiEditor is an Open Source Rich Text Editor Designed for AI.  ',
      lang,
    })
  })
})

onUnmounted(() => {
  aiEditor && aiEditor.destroy();
})
</script>


<style lang="less">
.aiEditor {
  * {
    box-sizing: content-box;
  }

  .aie-dropdown-item {
    h1, h2, h3, h4, h5, h6 {
      padding: 0;
      margin: 0;
      border: none;
    }
  }
}
</style>