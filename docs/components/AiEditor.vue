<template>
  <div>
    <h1>AiEditor，一个面向 AI 的富文本编辑器</h1>
  </div>
  <div ref="divRef" class="aiEditor" style="height: 600px"/>
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

<style lang="less">
  .aiEditor {
    *{
      box-sizing: content-box;
    }

    .aie-dropdown-item{
      h1,h2,h3,h4,h5,h6{
        padding: 0;
        margin: 0;
        border: none;
      }
    }



  }
</style>