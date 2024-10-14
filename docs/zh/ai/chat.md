# AI 对话
AI 对话指的是在菜单中，点击对话按钮，可以使用编辑内容与 AI 进行对话。其主要提供了 4 点能力：

- 直接选择编辑器的内容，作为对话的上下文，进行持续对话。
- 对话的 AI 内容，随时可以插入（或替换）到编辑器的指定位置。
- 支持历史对话
- 完善的功能配置

> 备注：当前功能只有在商业 Pro 版中提供，演示地址： http://pro.aieditor.com.cn

## 示例代码

```ts
new AiEditorPro({
    element: "#aiEditor",
    chat:{
        systemPrompt: "你的名字叫 AIEditor 编辑助手，你擅长...",
        helloMessage: "欢迎使用 AIEditor 编辑助手，你可以...",
        localStorageKey: "aie-chat-messages",
        maxAttachedMessageCount: 10,
        historyMessageTruncateEnable: false,
        historyMessageTruncateLength: 1000,
        historyMessageTruncateProcessor?: (message: string) => string,
        appendEditorSelectedContentEnable: true,
        appendEditorSelectedContentProcessor?: (userContent: string, selectedContent: string) => string,
        messagesToPayloadProcessor?: (messages: any, aiModel: AiModel) => string,
    },
})
```

## 配置说明

### systemPrompt

`systemPrompt` 具有系统角色的消息充当模型的顶级指令，通常描述模型应该做什么以及它通常应该如何行为和响应。
当配置了 `systemPrompt` 时，每次消息都会携带 `systemPrompt`，如下代码所示：

```json 7
{
  "model": "gpt-4o",
  "stream": true,
  "messages": [
    {
      "role": "system",
      "content": "你的名字叫 AIEditor 编辑助理，你擅长文字创作和内容优化。"
    },
    {
      "role": "user",
      "content": "你好"
    }
  ]
}
```

### helloMessage
用于配置当用户第一次打开 AI 对话框时的欢迎消息。

### localStorageKey
历史消息保存在 LocalStorage 的 key 值的定义，默认值为： `aie-chat-messages`

### maxAttachedMessageCount
在携带历史对话中，最大携带的历史消息条数，默认值为：`10`。条数越多，消耗的 token 越多。

### historyMessageTruncateEnable
是否开启历史消息截断，默认值为： `false`。

在 AI 响应的消息中，可能会有一些消息内容特别的长，如果我们把这些长消息提交给 AI，可能会消耗大量的 Token，
我们可以只截取一部分的内容进行提交，而非完整的内容。

### historyMessageTruncateLength
截取内容的长度，默认值为：`1000`。当配置 `historyMessageTruncateEnable: true` 时，此配置才有效。

### historyMessageTruncateProcessor
自定义历史消息截取处理器，此项配置后，`historyMessageTruncateLength` 的配置会失效。

在 AI 历史对话压缩策略中，除了对内容进行截取以外，还有 `摘要法`、`关键词提取` 等多种策略，都可以通过自定义配置
`historyMessageTruncateProcessor` 进行实现。

### appendEditorSelectedContentEnable
在消息对话中，是否自动追加编辑器选中的文本内容，默认值为：`true`。

### appendEditorSelectedContentProcessor
自定义 `用户消息` 和 `编辑器选择内容` 的处理器，默认代码如下：

```ts
appendEditorSelectedContentProcessor = (userContent, selectedContent)=>{
    return `${userContent}\n${selectedContent}`
}
```

### messagesToPayloadProcessor
此配置用于把历史消息内容转换为 payload ，充当 AI 请求的 body 内容，只有在自定义大模型时用到。
