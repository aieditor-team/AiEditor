import {fileUploader} from "./fileUploader.ts";
import {base64Uploader} from "./base64Uploader.ts";

export const getUploader = (url: string) => {
    return url ? fileUploader : base64Uploader
}