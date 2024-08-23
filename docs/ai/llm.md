# Large language models

Currently, AiEditor supports the `Openai（ChatGPT)`, `Spark large model`, `Wenxin Yiyuan`  and `custom LLMs`.

##


```ts
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            openai: {
                apiKey:"sk-alQ96zbDn*****"
            } as OpenaiModelConfig
        }
    },
})
```
Or use `moonshot` through Openai's config

```ts
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            openai: {
                endpoint:"https://api.moonshot.cn",
                model:"moonshot-v1-8k",
                apiKey:"sk-alQ96zb******"
            } as OpenaiModelConfig
        }
    },
})
```

## Spark large

```typescript
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            spark: {
                appId: "****",
                apiKey: "****",
                apiSecret: "****",
                protocol: "ws", //or wss
                version: "v3.1", //or other
            }
        }
    },
})
```

## Wenxin Yiyuan

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

## Gitee Ai

 Gitee AI's serverless API is used for support currently.

```typescript
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            gitee:{
                endpoint:"https://ai.gitee.com/api/inference/serverless/KGHCVOPBV7GY/chat/completions",
                apiKey:"***",
            }
        }
    },
})
```

More Gitee AI configurations, such as:

```typescript
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            gitee:{
                endpoint:"https://ai.gitee.com/api/inference/serverless/KGHCVOPBV7GY/chat/completions",
                apiKey:"***",
                max_tokens: 512,
                temperature: 0.7,
                top_p: 0.7,
                top_k: 50,
            }
        }
    },
})
```


## custom backend types of LLMs

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
                        // //0 represents the first text result; 1 represents the middle text result; 2 represents the last text result.
                        // status: 0|1|2,
                    }
                },
                // protocol: "sse" | "websocket"
            }
        }
    },
})
```


Parameter Description:

- `url`: A string or a method that returns a string.
- `headers`: Custom HTTP header information for SSE requests.
- `wrapPayload`: Converts the user's `prompt` string into the `JSON` format (or other formats) required by the `url` interface.
- `parseMessage`: Converts the body content of the backend response into the `AiMessage` format.

Definition of `AiMessage` is as follows:

```ts
declare interface AiMessage {
    role: string;
    content: string;
    index: number;
    status: 0 | 1 | 2;
}
```