# 附件配置


## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    attachment: {
        customMenuInvoke: (editor: Editor) => {
        },
        uploadUrl: "https://your-domain/attachment/upload",
        uploadFormName: "attachment", //上传时的文件表单名称
        // uploadHeaders: {
        //     "jwt": "xxxxx",
        //     "other": "xxxx",
        // },
        uploadHeaders: ()=>{
           return {
               "jwt": "xxxxx",
               "other": "xxxx"
           }
        },
        uploader: (file, uploadUrl, headers, formName) => {
            //可自定义附件上传逻辑
        },
        uploaderEvent: {
            onUploadBefore: (file, uploadUrl, headers) => {
                //监听附件上传之前，此方法可以不用回任何内容，但若返回 false，则终止上传
            },
            onSuccess: (file, response) => {
                //监听附件上传成功
                //注意：
                // 1、如果此方法返回 false，则附件不会被插入到编辑器
                // 2、可以在这里返回一个新的 json 给编辑器
            },
            onFailed: (file, response) => {
                //监听附件上传失败，或者返回的 json 信息不正确
            },
            onError: (file, error) => {
                //监听附件上传错误，比如网络超时等
            },
        }
    },
})
```


- **customMenuInvoke**：自定义工具栏的 “附件” 按钮的点击行为，比如点击不是选择本地文件，而是弹出一个对话框等自定义行为。
- **uploadUrl**：附件上传的 URL 地址。
- **uploadHeaders**：附件上传自定义 Http 头信息，数据类型为 `Object` 或者 返回一个 `Object` 的方法（ `Function` ）。
- **uploader**：自定义上传逻辑，默认是通过 `fetch` 进行上传。
- **uploaderEvent**：配置附件上传事件监听

## 服务器响应

附件上传成功后，要求服务器必须返回如下内容，其中 errorCode 必须为 0；


```json
{
  "errorCode": 0,
  "data": {
    "href": "http://your-domain.com/attachment.zip",
    "fileName": "文件名称.zip"
  }
}
```

- href： 附件地址
- fileName： 附件名称

若服务器返回的不是以上内容格式，我们可以通过配置 `dataProcessor` 对数据进行二次处理，并按以上格式返回。

