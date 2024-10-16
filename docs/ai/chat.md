# AI Chat
AI Chat means that in the menu, by clicking the dialogue button, you can use the edited content to have a dialogue with AI. It mainly provides 4 capabilities:

- Directly select the content of the editor as the context of the dialogue for continuous dialogue.
- The AI content of the dialogue can be inserted (or replaced) into the specified position of the editor at any time.
- Support historical dialogue
- Complete function configuration

> Note: The current function is only available in the commercial Pro version, demonstration address: http://pro.aieditor.com.cn


## Sample Code

```ts
new AiEditorPro({
    element: "#aiEditor",
    chat:{
        systemPrompt: "Your name is AIEditor Editing Assistant, you are good at...",
        helloMessage: "Welcome use AIEditor editing assistant, you can...",
        localStorageKey: "aie-chat-messages",
        placeholder: "what's your question?",
        maxHeight: 600,
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

## Configuration Instructions

### systemPrompt

`systemPrompt` Messages with the system role act as top-level instructions for models, typically describing what the model should do and how it should generally behave and respond.
When `systemPrompt` is configured, each message will carry `systemPrompt`, as shown in the following code:

```json 7
{
  "model": "gpt-4o",
  "stream": true,
  "messages": [
    {
      "role": "system",
      "content": "Your name is AIEditor Editorial Assistant, and you are good at text creation and content optimization."
    },
    {
      "role": "user",
      "content": "hello"
    }
  ]
}
```

### helloMessage
Used to configure the welcome message when the user first opens the AI dialog.

### localStorageKey
The key value definition of historical messages saved in LocalStorage, the default value is: `aie-chat-messages`

### placeholder
Set the placeholder attribute of the input box

### maxHeight
Set the maximum height of the chat window

### maxAttachedMessageCount
In the history conversation, the maximum number of history messages that can be carried is 10 by default. The more history messages there are, the more tokens are consumed.

### historyMessageTruncateEnable
Whether to enable historical message truncation, the default value is: `false`.

In the messages responded by AI, there may be some messages with very long content. If we submit these long messages to AI, it may consume a lot of tokens.
We can only intercept part of the content and submit it instead of the complete content.

### historyMessageTruncateLength
The length of the intercepted content. The default value is: `1000`. This configuration is only valid when `historyMessageTruncateEnable: true` is configured.

### historyMessageTruncateProcessor
Customize the history message truncate processor. After this configuration, the configuration of `historyMessageTruncateLength` will become invalid.

In the AI history dialogue compression strategy, in addition to content truncate, there are also multiple strategies such as `summary extraction` and `keyword extraction`, which can be implemented by custom configuration
`historyMessageTruncateProcessor`.

### appendEditorSelectedContentEnable
In the message dialog, whether to automatically append the text content selected by the editor. The default value is: `true`.

### appendEditorSelectedContentProcessor
Customize the handlers of `user message` and `editor selection content`. The default code is as follows:

```ts
appendEditorSelectedContentProcessor = (userContent, selectedContent)=>{
    return `${userContent}\n${selectedContent}`
}
```

### messagesToPayloadProcessor
This configuration is used to convert historical message content into payload, which serves as the body content of AI request. It is only used when customizing large models.
