# Video configuration

## Samples

```typescript
new AiEditor({
    element: "#aiEditor",
    video: {
        customMenuInvoke: (editor: Editor) => {
        },
        uploadUrl: "https://your-domain/video/upload",
        uploadFormName: "video", //Upload File Form Name
        uploadHeaders: {
            "jwt": "xxxxx",
            "other": "xxxx",
        },
        uploader: (file, uploadUrl, headers, formName) => {
            //Customizable video Upload Logic
        },
        uploaderEvent: {
            onUploadBefore: (file, uploadUrl, headers) => {
                //Listen for the video upload before it happens. This method can be left without returning any content, but if it returns false, the upload will be aborted.
            },
            onSuccess: (file, response) => {
                //Listen for Video Upload Success
                //Note：
                // 1. If this method returns false, the Video will not be inserted into the editor.
                // 2.You can return a new JSON object to the editor here.
            },
            onFailed: (file, response) => {
                //Listen for Video Upload Failure, or if the returned JSON information is incorrect.
            },
            onError: (file, error) => {
                //Listen for Video Upload Errors, such as network timeouts, etc.
            },
        }
    },
})
```

- **customMenuInvoke**: Customize the behavior of the "Video" button in the toolbar, such as clicking not to select a local file, but to pop up a dialog box or other custom behaviors.
- **uploadUrl**: The URL address for video upload.
- **uploadHeaders**: Custom HTTP header information for video upload, the data type is `Object` or a method (`Function`) that returns an `Object`.
- **uploader**: Custom upload logic, by default, it is uploaded through `fetch`.
- **uploaderEvent**: Configure event listeners for video uploads.

## Server response

After the video is successfully uploaded, the server must return the following content, where errorCode must be 0;

```json
{
  "errorCode": 0,
  "data": {
    "src": "http://your-domain.com/video.mp4",
    "poster": "http://your-domain.com/poster.jpg"
  }
}
```

- src：  video playback address
- poster： the cover address of the video

If the server returns a content format other than the above, we can configure `dataProcessor` the data to reprocess and return it in the above format.

