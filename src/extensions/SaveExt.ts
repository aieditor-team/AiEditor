import {Extension} from "@tiptap/core";
import {AiEditor, InnerEditor} from "../core/AiEditor.ts";


export interface SaveExtOptions {
    onSave?: (e: AiEditor) => boolean,
}

export const SaveExt = Extension.create<SaveExtOptions>({
    name: "saveExt",
    addKeyboardShortcuts() {
        return {
            'Mod-s': ({editor}) => {
                if (this.options.onSave) {
                    return this.options.onSave((editor as InnerEditor).aiEditor)
                }
                return false;
            },
        }
    },
})
