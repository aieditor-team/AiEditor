<template>
  <div>
    <h1>AiEditor，一个面向 AI 的富文本编辑器</h1>
  </div>
  <div ref="divRef" style="height: 600px"/>
</template>

<!--<script setup lang="ts">-->
<!--import {AiEditor} from "aieditor";-->
<!--import "aieditor/dist/style.css"-->
<!--import {onMounted, onUnmounted, ref} from "vue";-->

<!--const divRef = ref();-->
<!--let aiEditor: AiEditor | null = null;-->

<!--onMounted(() => {-->
<!--  aiEditor = new AiEditor({-->
<!--    element: divRef.value as Element,-->
<!--    placeholder: "点击输入内容...",-->
<!--    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',-->
<!--  })-->
<!--})-->

<!--onUnmounted(() => {-->
<!--  aiEditor && aiEditor.destroy();-->
<!--})-->
<!--</script>-->

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