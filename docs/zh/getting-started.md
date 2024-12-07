# 快速开始


## 现代开发模式

安装：

```shell
npm i aieditor
```


使用：

HTML:

```html
<div id="aiEditor" style="height: 550px;  margin: 20px"></div>
```


Typescript:

```typescript
import {AiEditor} from "aieditor";
import "aieditor/dist/style.css"

new AiEditor({
    element: "#aiEditor",
    placeholder: "点击输入内容...",
    content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
    ai: {
        models: {
            spark: {
                appId: "***",
                apiKey: "***",
                apiSecret: "***",
            }
        }
    }
})
```


