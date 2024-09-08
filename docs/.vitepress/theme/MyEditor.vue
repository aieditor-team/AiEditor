<template>
  <div style="display: block;text-align: start">
    <div ref="divRef" class="aiEditor" style="height: 850px;max-width: 1280px"/>
  </div>
</template>

<script setup lang="ts">
// import {AiEditor} from "aieditor";
import "aieditor/dist/style.css"
import {onMounted, onUnmounted, ref} from "vue";
import {config} from "./spark";


const {lang} = defineProps(['lang'])
const divRef = ref();
let aiEditor: any = null;

onMounted(() => {
  //for ssr
  import('aieditor').then(({AiEditor}) => {

    const menus: any = lang === "en" ?
            [
              {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M4 18.9997H20V13.9997H22V19.9997C22 20.552 21.5523 20.9997 21 20.9997H3C2.44772 20.9997 2 20.552 2 19.9997V13.9997H4V18.9997ZM16.1716 6.9997L12.2218 3.04996L13.636 1.63574L20 7.9997L13.636 14.3637L12.2218 12.9495L16.1716 8.9997H5V6.9997H16.1716Z"></path></svg>`,
                name: "Continues writing",
                prompt: "Please help me further expand on this passage.",
                text: "focusBefore",
              },
              {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M15 5.25C16.7949 5.25 18.25 3.79493 18.25 2H19.75C19.75 3.79493 21.2051 5.25 23 5.25V6.75C21.2051 6.75 19.75 8.20507 19.75 10H18.25C18.25 8.20507 16.7949 6.75 15 6.75V5.25ZM4 7C4 5.89543 4.89543 5 6 5H13V3H6C3.79086 3 2 4.79086 2 7V17C2 19.2091 3.79086 21 6 21H18C20.2091 21 22 19.2091 22 17V12H20V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7Z"></path></svg>`,
                name: "Optimization",
                prompt: "Please help me optimize the content of this passage and provide the result.",
                text: "selected",
              },
              {
                icon:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M5 15V17C5 18.0544 5.81588 18.9182 6.85074 18.9945L7 19H10V21H7C4.79086 21 3 19.2091 3 17V15H5ZM18 10L22.4 21H20.245L19.044 18H14.954L13.755 21H11.601L16 10H18ZM17 12.8852L15.753 16H18.245L17 12.8852ZM8 2V4H12V11H8V14H6V11H2V4H6V2H8ZM17 3C19.2091 3 21 4.79086 21 7V9H19V7C19 5.89543 18.1046 5 17 5H14V3H17ZM6 6H4V9H6V6ZM10 6H8V9H10V6Z"></path></svg>`,
                name: "More Custom Menu...",
                prompt: "Please help me translate this paragraph into Chinese and return the result in Chinese, without any explanation or other content beyond the translation result.",
                text: "selected",
              },
            ] : null,

        aiEditor = new AiEditor({
          element: divRef.value as Element,
          placeholder: "Click to Input Content...",
          content: 'AiEditor is an Open Source Rich Text Editor Designed for AI.  ',
          ai: {
            models: {
              // spark: {
              //   ...config
              // }

              gitee:{
                endpoint:"https://ai.gitee.com/api/serverless/Qwen2-7B-Instruct/chat/completions",
                apiKey:"P07AGYTQBNHREVNGDCM8XATPJLY8RVESLLLNWCNR",
              }
            },
            menus,
          },
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