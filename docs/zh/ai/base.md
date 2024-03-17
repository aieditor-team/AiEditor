# AI 基础配置


## 代码示例

```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        models:{
            spark:{
                appId:"****",
                apiKey:"****",
                apiSecret:"****"
            }
        },
        bubblePanelEnable: true,
        bubblePanelModel: "spark",
        onCreateClientUrl: "...."
    },
})
```

- **models**: 模型配置（目前暂时只支持科大讯飞的星火大模型）
- **bubblePanelEnable**: 弹出框使用的 ai 模型名称
- **bubblePanelModel**: 弹出框使用的 ai 模型名称
- **onCreateClientUrl**: 自定义 URL 签名算法，一般情况下，如果编辑器涉及内容对外开放，则需要配置 onCreateURL，用于通过 server 端对 url 签名生成通信 url。
- **spark**: 星火大模型配置，星火大模型支持配置的内容如下：


```typescript
protocol?: string,
appId: string,
apiKey?: string,
apiSecret?: string,
version?: string,
```
- **protocol**：通信协议，支持 ws 和 wss。
- **appId**：应用 ID。
- **apiKey**：api Key。
- **apiSecret**：api 秘钥。
- **version**: 版本，默认为 v3.1。


## 服务端签名

在使用 AiEditor 中，如果是用于内部用户，我们可以通过前端配置模型的 `appId`、`apiKey`、`apiSecret` ，这是没问题的。

但是，AiEditor 给普通互联网用户使用，则不应该把 `appId`、`apiKey`、`apiSecret` 配置在前端，而是通过后端服务对 Ai 请求路径进行签名，
需要自定义配置 `onCreateClientUrl` 才能保证秘钥安全。


示例代码如下：

```typescript
new AiEditor({
    element: "#aiEditor",
    ai:{
        models:{
            spark:{
                appId: "****",
            }
        },
        onCreateClientUrl: (modelName, modelConfig, startFn)=>{
            //通过后端获取到 签名 url 后，执行 startFn 并传入 url。
            fetch("/your-path/getUrl?appId="+modelConfig.appId)
                .then(resp=>resp.json)
                .then(json=> {
                    startFn(json.url)
                })
        },
        onTokenConsume(_, __, count) {
            axios.post("/api/v1/resource/doTokenCounting", {
                count
            })
        }
    },
})
```

## 记录 Token 消耗情况

示例代码如下：

```typescript
new AiEditor({
    element: "#aiEditor",
    ai: {
        models: {
            spark: {
                appId: "****",
            }
        },
        onTokenConsume(modelName, modelConfig, count) {
            //当有 token 消耗时，会回调此方法
            axios.post("/api/v1/resource/doTokenCounting", {
                count
            })
        }
    },
})
```