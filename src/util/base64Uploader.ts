export const base64Uploader = (file: File, _uploadUrl: string, _headers: Record<string, any>, _formName: string): Promise<Record<string, any>> => {
    let reader = new FileReader;
    return new Promise((accept, fail) => {
        reader.onload = () => accept({src:reader.result as string});
        reader.onerror = () => fail(reader.error);
        setTimeout(() => reader.readAsDataURL(file), 1500);
    })
}