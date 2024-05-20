# Attachment configuration


## Samples

```typescript
new AiEditor({
    element: "#aiEditor",
    attachment: {
        customMenuInvoke: (editor: Editor) => {
        },
        uploadUrl: "https://your-domain/attachment/upload",
        uploadFormName: "attachment", //Upload File Form Name
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
            //Customizable Image Upload Logic
        },
        uploaderEvent: {
            onUploadBefore: (file, uploadUrl, headers) => {
                //Listen for the attachment upload before it happens. This method can be left without returning any content, but if it returns false, the upload will be aborted.
            },
            onSuccess: (file, response) => {
                //Listen for attachment Upload Success
                //Note:
                //  1. If this method returns false, the attachment will not be inserted into the editor.
                // 2.You can return a new JSON object to the editor here.
            },
            onFailed: (file, response) => {
                //Listen for attachment Upload Failure, or if the returned JSON information is incorrect.
            },
            onError: (file, error) => {
                //Listen for attachment Upload Errors, such as network timeouts, etc.
            },
        }
    },
})
```


- **customMenuInvoke**: Customize the behavior of the "Attachment" button in the toolbar, such as clicking not to select a local file, but to pop up a dialog box or other custom behaviors.
- **uploadUrl**: The URL address for attachment upload.
- **uploadHeaders**: Custom HTTP header information for attachment upload, the data type is `Object` or a method (`Function`) that returns an `Object`.
- **uploader**: Custom upload logic, by default, it is uploaded through `fetch`.
- **uploaderEvent**: Configure event listeners for attachment uploads.



## Server response

After the attachment is successfully uploaded, the server must return the following content, where errorCode must be 0;


```json
{
  "errorCode": 0,
  "data": {
    "href": "http://your-domain.com/attachment.zip",
    "fileName": "File Name.zip"
  }
}
```

- href： attachment address
- fileName： The name of the attachment

If the server returns a content format other than the above, we can configure `dataProcessor` the data to reprocess and return it in the above format.

