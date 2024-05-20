# AI Infrastructure


## Samples

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

- **models**: Model configuration (currently only supports Xunfei's Spark large model)
- **bubblePanelEnable**: Name of the AI model used for the pop-up panel
- **bubblePanelModel**: Name of the AI model used for the pop-up panel
- **onCreateClientUrl**: Custom URL signing algorithm. Generally, if the editor involves content open to the public, onCreateURL needs to be configured to sign the URL through the server to generate a communication URL.
- **spark**: Configuration for the Spark large model. Supported configurations for the Spark large model include:


```typescript
protocol?: string,
appId: string,
apiKey?: string,
apiSecret?: string,
version?: string,
```

- **protocol**: Communication protocol, supports ws and wss.
- **appId**: Application ID.
- **apiKey**: API Key.
- **apiSecret**: API secret key.
- **version**: Version, default is v3.1.


## Server-side signature


When using AiEditor for internal users, it's acceptable to configure the model's `appId`, `apiKey`, and `apiSecret` on the frontend. 

However, for ordinary internet users, `appId`, `apiKey`, and `apiSecret` should not be configured on the frontend. Instead, they should be signed through backend services for Ai request paths. Custom configuration of `onCreateClientUrl` is required to ensure key security.


Samples：

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
            //After obtaining the signed URL from the backend, execute the startFn function and pass the URL as a parameter.
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

## Record token consumption

sample：

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
            //This method will be called when a token is consumed.
            axios.post("/api/v1/resource/doTokenCounting", {
                count
            })
        }
    },
})
```