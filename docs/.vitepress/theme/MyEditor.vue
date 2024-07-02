<template>
  <div style="display: block;text-align: start">
    <div ref="divRef" class="aiEditor" style="height: 850px;max-width: 1280px"/>
  </div>
</template>

<script lang="ts" >
import {AiEditor} from "aieditor";
import "aieditor/dist/style.css"
// import {onMounted, ref} from 'vue'
//
// const divRef = ref();


// onMounted(() => {
//   // import('aieditor').then(({AiEditor}) => {
//     new AiEditor({
//       element: divRef.value as Element,
//       placeholder: "点击输入内容...",
//       content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
//     })
//   // })
// })


export default {
  mounted() {
      new AiEditor({
        element: this.$refs.divRef as Element,
        placeholder: "点击输入内容...",
        content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
      })
  }
}
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