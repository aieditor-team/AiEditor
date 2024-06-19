# 大语言模型

目前，AiEditor 支持 `Openai（ChatGPT）`、`星火大模型`、`文心一言`以及 `自定义后端` 类型的大语言模型。

## Openai（ChatGPT）

```ts
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            openai: {
                apiKey: "sk-alQ96zbDn*****"
            }
        }
    },
})
```
或者通过 Openai 的接口使用 `月之暗面` 或者其他和 Openai API 兼容的模型。
```ts
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            openai: {
                endpoint: "https://api.moonshot.cn",
                model: "moonshot-v1-8k",
                apiKey: "sk-alQ96zb******"
            }
        }
    },
})
```



## 星火大模型

```typescript
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            spark: {
                appId: "****",
                apiKey: "****",
                apiSecret: "****",
                protocol: "ws", //或者 wss
                version: "v3.1", //或者其他
            }
        }
    },
})
```

## 文心一言

```typescript
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            wenxin: {
                access_token: "****",
                protocol: "****",
                version: "****"
            }
        }
    },
})
```


## 自定义大语言模型

```typescript
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            custom: {
                url: "http://127.0.0.1:8080/api/v1/ai/chat",
                headers: () => {
                    return {
                        "jwt": "xxxx"
                    }
                },
                wrapPayload: (message: string) => {
                    return JSON.stringify({prompt: message})
                },
                parseMessage: (message: string) => {
                    return {
                        role: "assistant",
                        content: message,
                        // index: number,
                        // //0 代表首个文本结果；1 代表中间文本结果；2 代表最后一个文本结果。
                        // status: 0|1|2,
                    }
                },
                // protocol: "sse" | "websocket"
            }
        }
    },
})
```
参数说明：

- `url`: 字符串，或者返回一个字符串的方法
- `headers`: 自定义 sse 请求的 http 头信息
- `wrapPayload`: 把用户的 `prompt` 字符串，转换为 `url` 接口所需要的 `json` 格式（亦或者其他格式）。
- `parseMessage`：把后端响应的 `body` 内容，转换为 `AiMessage` 格式。

`AiMessage` 定义如下：

```ts
declare interface AiMessage {
    role: string;
    content: string;
    index: number;
    status: 0 | 1 | 2;
}
```