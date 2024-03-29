import {Plugin, PluginKey} from 'prosemirror-state'
import {uuid} from "../util/uuid.ts";
import {DecorationSet} from "prosemirror-view";
import {createAttachmentDecoration} from "../util/decorations.ts";
import {Extension} from "@tiptap/core";
import {getUploader} from "../util/getUploader.ts";
import {UploaderEvent} from "../core/AiEditor.ts";

export interface AttachmentOptions {
    HTMLAttributes: Record<string, any>,
    uploadUrl?: string,
    uploadHeaders?: (() => Record<string, any>) | Record<string, any>,
    uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
    uploaderEvent?: UploaderEvent,
    uploadFormName?: string,
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        attachment: {
            uploadAttachment: (file: File) => ReturnType,
        }
    }
}


export type AttachmentAction = {
    type: "add" | "remove";
    id: string;
    pos: number;
    text: string,
}

const key = new PluginKey("aie-attachment-plugin");
const actionKey = "attachment_action";

export const AttachmentExt = Extension.create<AttachmentOptions>({
    name: 'attachment',

    addOptions() {
        return {
            uploadUrl: "",
            uploadHeaders: {},
            HTMLAttributes: {},
        }
    },

    addCommands() {
        return {
            uploadAttachment: (file: File) => () => {

                const headers = (typeof this.options.uploadHeaders === "object") ? this.options.uploadHeaders :
                    ((typeof this.options.uploadHeaders === "function") ? this.options.uploadHeaders() : {});

                if (this.options.uploaderEvent && this.options.uploaderEvent.onUploadBefore) {
                    if (this.options.uploaderEvent.onUploadBefore(file, this.options.uploadUrl!, headers) === false) {
                        return false;
                    }
                }

                const id = uuid();
                const {state: {tr}, view, schema} = this.editor!
                if (!tr.selection.empty) tr.deleteSelection();

                view.dispatch(tr.setMeta(actionKey, {
                    type: "add",
                    id,
                    pos: tr.selection.from,
                    text: file.name,
                }));


                const uploader = this.options.uploader || getUploader(this.options.uploadUrl!);
                const uploadFormName = this.options.uploadFormName || "attachment";
                uploader(file, this.options.uploadUrl!, headers, uploadFormName)
                    .then(json => {

                        //process on success
                        if (this.options.uploaderEvent?.onSuccess) {
                            const result = this.options.uploaderEvent.onSuccess(file, json);
                            if (typeof result === "boolean" && !result) {
                                return;
                            }
                            if (typeof result === "object") {
                                json = result;
                            }
                        }

                        if (json.errorCode === 0 && json.data && json.data.href) {
                            const decorations = key.getState(this.editor.state) as DecorationSet;
                            let found = decorations.find(void 0, void 0, spec => spec.id == id)
                            const fileName = json.data.fileName || file.name;
                            view.dispatch(view.state.tr
                                .insertText(` ${fileName} `, found[0].from)
                                .addMark(found[0].from + 1, fileName.length + found[0].from + 1, schema.marks.link.create({
                                    href: json.data.href,
                                    target: "_blank"
                                }))
                                .setMeta(actionKey, {type: "remove", id}));
                        } else {
                            view.dispatch(tr.setMeta(actionKey, {type: "remove", id}));
                            if (this.options.uploaderEvent && this.options.uploaderEvent.onFailed) {
                                this.options.uploaderEvent.onFailed(file, json);
                            }
                        }
                    }).catch((err) => {
                    const {state: {tr}, view} = this.editor!
                    view.dispatch(tr.setMeta(actionKey, {type: "remove", id}));
                    if (this.options.uploaderEvent && this.options.uploaderEvent.onError) {
                        this.options.uploaderEvent.onError(file, err);
                    }
                })

                return true;
            }
        };
    },


    addProseMirrorPlugins() {
        const editor = this.editor;
        return [
            new Plugin({
                key: key,
                state: {
                    init: () => DecorationSet.empty,
                    apply: (tr, set) => {

                        const action = tr.getMeta(actionKey) as AttachmentAction;

                        // update decorations position
                        set = set.map(tr.mapping, tr.doc);

                        // add decoration
                        if (action && action.type === "add") {
                            set = set.add(tr.doc, [createAttachmentDecoration(action)]);
                        }
                        // remove decoration
                        else if (action && action.type === "remove") {
                            set = set.remove(set.find(undefined, undefined,
                                spec => spec.id == action.id));
                        }
                        return set;
                    }
                },

                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                    handleDOMEvents: {
                        drop(_, event) {
                            const hasFiles = event.dataTransfer &&
                                event.dataTransfer.files &&
                                event.dataTransfer.files.length

                            if (!hasFiles) return false

                            const attachments = Array
                                .from(event.dataTransfer.files)
                                .filter(file => !(/video/i).test(file.type) && !(/image/i).test(file.type))

                            event.preventDefault()

                            attachments.forEach(attachment => {
                                editor.commands.uploadAttachment(attachment);
                            })

                            return true
                        }
                    }
                }
            }),
        ]
    },


})