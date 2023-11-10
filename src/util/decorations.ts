import {Decoration} from "prosemirror-view";

export const createMediaDecoration = (action: { pos: number, id: string }) => {
    const placeholder = document.createElement("div");
    placeholder.classList.add("aie-loader-placeholder");
    placeholder.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 3C16.9706 3 21 7.02944 21 12H19C19 8.13401 15.866 5 12 5V3Z"></path></svg>
    `
    return Decoration.widget(action.pos, placeholder, {id: action.id});
}

export const createAttachmentDecoration = (action: { pos: number, id: string ,text:string}) => {
    const placeholder = document.createElement("div");
    placeholder.classList.add("aie-loader-placeholder");
    placeholder.style.height = "20px"
    placeholder.style.display="inline-block"
    placeholder.innerHTML = `
    <svg style="width: 16px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"></path><path d="M12 3C16.9706 3 21 7.02944 21 12H19C19 8.13401 15.866 5 12 5V3Z"></path></svg>
   ${action.text}
    `
    return Decoration.widget(action.pos, placeholder, {id: action.id});
}