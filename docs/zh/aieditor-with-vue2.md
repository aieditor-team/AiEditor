# AiEditor 与 Vue2 整合


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

**注意！注意！注意！** 许多同学在和 vue2 整合的过程中，可能由于 vue2 的版本过低，导致`编译出错`，解决这个问题有两个方案：

**方案1：** 修改 `tsconfig.json` 的 `esnext` 配置为 `es2018`，如下所示：

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "es2018"
    // 其他配置...
  }
  // 其他配置...
}
```

**方案2：** 升级 vue2 到 vue2.7 或以上。