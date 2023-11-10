import {uploadFile} from "./uploadFile.ts";
import {base64Uploader} from "./base64Uploader.ts";

export const getUploader = (url:string)=>{
    return url ? uploadFile : base64Uploader
}