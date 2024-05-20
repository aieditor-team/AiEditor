# Large language models

Currently, AiEditor supports the `Spark large model`, `Wenxin Yiyuan`, and `custom backend types of large language models`.

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


## custom backend types of large language models

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
                messageWrapper: (message: string) => {
                    return JSON.stringify({prompt: message})
                },
                messageParser: (message: string) => {
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
- `messageWrapper`: Converts the user's `prompt` string into the `JSON` format (or other formats) required by the `url` interface.
- `messageParser`: Converts the body content of the backend response into the `AiMessage` format.

Definition of `AiMessage` is as follows:

```ts
declare interface AiMessage {
    role: string;
    content: string;
    index: number;
    status: 0 | 1 | 2;
}
```