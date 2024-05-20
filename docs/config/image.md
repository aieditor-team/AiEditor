# Image configuration

## Samples

```typescript
new AiEditor({
    element: "#aiEditor",
    image: {
        allowBase64: true,
        defaultSize: 350,
        customMenuInvoke: (editor: Editor) => {
        },
        uploadUrl: "https://your-domain/image/upload",
        uploadFormName: "image", //Upload File Form Name
        uploadHeaders: {
            "jwt": "xxxxx",
            "other": "xxxx",
        },
        uploader: (file, uploadUrl, headers, formName) => {
            //Customizable Image Upload Logic
        },
        uploaderEvent: {
            onUploadBefore: (file, uploadUrl, headers) => {
                //Listen for the image upload before it happens. This method can be left without returning any content, but if it returns false, the upload will be aborted.
            },
            onSuccess: (file, response) => {
                //Listen for Image Upload Success
                //note:
                //  1. If this method returns false, the image will not be inserted into the editor.
                //  2.You can return a new JSON object to the editor here.
            },
            onFailed: (file, response) => {
                //Listen for Image Upload Failure, or if the returned JSON information is incorrect.
            },
            onError: (file, error) => {
                //Listen for Image Upload Errors, such as network timeouts, etc.
            },
        }
    },
})
```


- **allowBase64**: Whether to allow images with base64 content, the configuration value is true or false, with the default being true.
- **defaultSize**: Default image size, when not configured, the default value is 350 (i.e., 350 pixels).
- **customMenuInvoke**: Customize the behavior of the "Image" button in the toolbar, such as clicking not to select a local file, but to pop up a dialog box or other custom behaviors.
- **uploadUrl**: The URL address for image upload.
- **uploadHeaders**: Custom HTTP header information for image upload, the data type is `Object` or a method ( `Function` ) that returns an `Object`.
- **uploader**: Custom upload logic, by default, it is uploaded through `fetch`.
- **uploaderEvent**: Configure event listeners for image uploads.


## Server response

After the image is successfully uploaded, the server must return the following content, where errorCode must be 0;

```json
{
  "errorCode": 0,
  "data": {
    "src": "http://your-domain.com/image.jpg",
    "alt": "image alt"
  }
}
```

If the server returns a content format other than the above, we can reprocess the data through `uploaderEvent` the configuration and `onSuccess` return a new `json` content in the above format.

## Custom Uploader Code Example

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