# AI 配置



```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        model:{
            xinghuo:{
                appId:"****",
                apiKey:"****",
                apiSecret:"****"
            }
        }
    },
})
```

- **model**: 模型配置（目前暂时只支持科大讯飞的星火大模型）
- **xinghuo**: 星火大模型配置，星火大模型支持配置的内容如下：

```typescript
protocol?: string,
appId: string,
apiKey?: string,
apiSecret?: string,
version?: string,
urlSignatureAlgorithm?:(model:XingHuoModel)=>string,
```
- **protocol**：通信协议，支持 ws 和 wss。
- **appId**：应用 ID。
- **apiKey**：api Key。
- **apiSecret**：api 秘钥。
- **version**: 版本，默认为 v3.1。
- **urlSignatureAlgorithm**: 自定义 URL 签名算法，一般情况下，如果编辑器涉及内容对外开放，则需要配置 urlSignatureAlgorithm，用于通过 server 端对 url 签名生成通信 url。

