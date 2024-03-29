# 图片配置

## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    image: {
        allowBase64: true,
        defaultSize: 350,
        customMenuInvoke: (editor: Editor) => {
        },
        uploadUrl: "https://your-domain/image/upload",
        uploadFormName: "image", //上传时的文件表单名称
        uploadHeaders: {
            "jwt": "xxxxx",
            "other": "xxxx",
        },
        uploader: (file, uploadUrl, headers, formName) => {
            //可自定义图片上传逻辑
        },
        uploaderEvent: {
            onUploadBefore: (file, uploadUrl, headers) => {
                //监听图片上传之前，此方法可以不用回任何内容，但若返回 false，则终止上传
            },
            onSuccess: (file, response) => {
                //监听图片上传成功
                //注意：
                // 1、如果此方法返回 false，则图片不会被插入到编辑器
                // 2、可以在这里返回一个新的 json 给编辑器
            },
            onFailed: (file, response) => {
                //监听图片上传失败，或者返回的 json 信息不正确
            },
            onError: (file, error) => {
                //监听图片上传错误，比如网络超时等
            },
        }
    },
})
```

- **allowBase64**：是否允许 base64 内容的图片，配置值为 true 或者 false，默认为 true。
- **defaultSize**：默认图片大小，当不配置时，默认值为 350（即：350 像素）。
- **customMenuInvoke**：自定义工具栏的 “图片” 按钮的点击行为，比如点击不是选择本地文件，而是弹出一个对话框等自定义行为。
- **uploadUrl**：图片上传的 URL 地址。
- **uploadHeaders**：图片上传自定义 Http 头信息，数据类型为 `Object` 或者 返回一个 `Object` 的方法（ `Function` ）。
- **uploader**：自定义上传逻辑，默认是通过 `fetch` 进行上传。
- **uploaderEvent**：配置图片上传事件监听


## 服务器响应

图片上传成功后，要求服务器必须返回如下内容，其中 errorCode 必须为 0；

```json
{
  "errorCode": 0,
  "data": {
    "src": "http://your-domain.com/image.jpg",
    "alt": "图片 alt"
  }
}
```

若服务器返回的不是以上内容格式，我们可以通过配置 `uploaderEvent` 的 `onSuccess` 对数据进行二次处理，并按以上格式返回新的 `json` 内容。

## 自定义 uploader 代码示例

Typescript:

```typescript
new AiEditor({
    element: "#aiEditor",
    image: {
        uploadUrl: "https://your-domain/image/upload",
        uploadHeaders: {
            "jwt":"xxxxx",
            "other":"xxxx",
        },
        uploader: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string): Promise<Record<string, any>> => {
            const formData = new FormData();
            formData.append(formName, file);
            return new Promise((resolve, reject) => {
                fetch(uploadUrl, {
                    method: "post",
                    headers: {'Accept': 'application/json', ...headers},
                    body: formData,
                }).then((resp) => resp.json())
                    .then(json => {
                        resolve(json);
                    }).catch((error) => {
                    reject(error);
                })
            });
        }
    },
})
```

Javascript:


```js
new AiEditor({
    element: "#aiEditor",
    image: {
        uploadUrl: "https://your-domain/image/upload",
        uploadHeaders: {
            "jwt":"xxxxx",
            "other":"xxxx",
        },
        uploader: (file, uploadUrl, headers, formName) => {
            const formData = new FormData();
            formData.append(formName, file);
            return new Promise((resolve, reject) => {
                fetch(uploadUrl, {
                    method: "post",
                    headers: {'Accept': 'application/json', ...headers},
                    body: formData,
                }).then((resp) => resp.json())
                    .then(json => {
                        resolve(json);
                    }).catch((error) => {
                    reject(error);
                })
            });
        }
    },
})
```