export const uploadFile = (file: File, uploadUrl: string, headers: Record<string, any>, formName: string): Promise<Record<string, any>> => {
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