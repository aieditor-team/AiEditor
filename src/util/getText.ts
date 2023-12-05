import {Node,Fragment} from "prosemirror-model";

export const getText = (node:Node | Fragment) => {
    let text = "";
    node.descendants((node)=>{
        if (node.text){
            text += node.text;
        }
    })
    return text;
}