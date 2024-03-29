import {
    Image
} from '@tiptap/extension-image';
import {mergeAttributes} from "@tiptap/core";
import {resize} from "../util/resize";
import {Plugin, PluginKey} from "@tiptap/pm/state";
import {DecorationSet} from "prosemirror-view";
import {TextSelection} from "prosemirror-state";
import {uuid} from "../util/uuid.ts";
import {createMediaDecoration} from "../util/decorations.ts";
import {getUploader} from "../util/getUploader.ts";
import {UploaderEvent} from "../core/AiEditor.ts";

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        Image: {
            uploadImage: (file: File) => ReturnType;
        };
    }
}

export interface ImageOptions {
    inline: boolean,
    allowBase64: boolean,
    defaultSize: number,
    HTMLAttributes: Record<string, any>,
    uploadUrl?: string,
    uploadHeaders?: (() => Record<string, any>) | Record<string, any>,
    uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
    uploaderEvent?: UploaderEvent,
    uploadFormName?: string,
}

export type ImageAction = {
    type: "add" | "remove";
    id: string;
    pos: number;
}

const key = new PluginKey("aie-image-plugin");
const actionKey = "image_action";
export const ImageExt = Image.extend<ImageOptions>({

        name: "image",
        draggable: true,
        selectable: true,

        addOptions() {
            return {
                ...this.parent?.(),
                uploadUrl: "",
                uploadHeaders: {},
                uploader: void 0,
                defaultSize: 350,
            }
        },

        allowGapCursor() {
            return !this.options.inline;
        },

        addAttributes() {
            return {
                src: {
                    default: '',
                    parseHTML: (element) => `${element.getAttribute('src') ?? ''}`,
                },
                alt: {
                    default: '',
                },
                title: {
                    default: '',
                },
                width: {
                    default: this.options.defaultSize,
                },
                height: {
                    default: 'auto',
                },
                align: {
                    default: 'left',
                },
            };
        },

        parseHTML() {
            return [
                {
                    tag: this.options.allowBase64
                        ? 'img[src]'
                        : 'img[src]:not([src^="data:"])',
                },
            ];
        },

        renderHTML({HTMLAttributes}) {
            return [
                'img',
                mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
            ];
        },


        addCommands() {
            return {
                ...this.parent?.(),

                uploadImage: (file: File) => () => {
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
                    }));


                    const uploader = this.options.uploader || getUploader(this.options.uploadUrl!);
                    const uploadFormName = this.options.uploadFormName || "image";
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

                            if (json.errorCode === 0 && json.data && json.data.src) {
                                const decorations = key.getState(this.editor.state) as DecorationSet;
                                let found = decorations.find(void 0, void 0, spec => spec.id == id)
                                view.dispatch(view.state.tr
                                    .insert(found[0].from, schema.nodes.image.create({
                                        src: json.data.src,
                                        alt: json.data.alt,
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
            }
        },


        addNodeView() {
            return (e) => {
                if (!this.editor.isEditable) {
                    return {}
                }
                const container = document.createElement('div')
                const {src, width, height, align} = e.node.attrs;
                container.classList.add(`align-${align}`)
                container.innerHTML = `
                <div class="aie-resize-wrapper">
                    <div class="aie-resize">
                        <div class="aie-resize-btn-top-left" data-position="left" draggable="true"></div>
                        <div class="aie-resize-btn-top-right" data-position="right" draggable="true"></div>
                        <div class="aie-resize-btn-bottom-left" data-position="left" draggable="true"></div>
                        <div class="aie-resize-btn-bottom-right" data-position="right" draggable="true"></div>
                    </div>
                    <img src="${src}" style="width: ${width}px; height: ${height}" class="align-${align} resize-obj">
                </div>
                `
                resize(container, e.editor.view.dom, (attrs) => e.editor.commands.updateAttributes("image", attrs));

                return {
                    dom: container,
                }
            }
        },


        addProseMirrorPlugins() {
            const editor = this.editor;
            return [
                new Plugin({
                    key: key,
                    state: {
                        init: () => DecorationSet.empty,
                        apply: (tr, set) => {
                            const action = tr.getMeta(actionKey) as ImageAction;
                            if (action) {
                                // update decorations position
                                let removed = false;
                                const newSet = set.map(tr.mapping, tr.doc, {
                                    onRemove: (_) => {
                                        removed = true;
                                    }
                                });

                                if (!removed) {
                                    set = newSet;
                                }

                                // add decoration
                                if (action.type === "add") {
                                    set = set.add(tr.doc, [createMediaDecoration(action)]);
                                }
                                // remove decoration
                                else if (action.type === "remove") {
                                    set = set.remove(set.find(void 0, void 0,
                                        spec => spec.id == action.id));
                                }
                            }
                            return set;
                        }
                    },


                    props: {
                        decorations(state) {
                            return this.getState(state);
                        },

                        handlePaste: (_, event) => {
                            const items = Array.from(event.clipboardData?.items || []);
                            for (const item of items) {
                                if (item.type.indexOf("image") === 0) {
                                    event.preventDefault();
                                    const file = item.getAsFile();
                                    if (file) {
                                        this.editor.commands.uploadImage(file);
                                    }
                                }
                            }
                        },

                        handleDOMEvents: {
                            drop(view, event) {
                                const hasFiles = event.dataTransfer &&
                                    event.dataTransfer.files &&
                                    event.dataTransfer.files.length

                                if (!hasFiles) return false

                                const images = Array
                                    .from(event.dataTransfer.files)
                                    .filter(file => (/image/i).test(file.type))

                                if (images.length === 0) return false

                                event.preventDefault()

                                const {state: {tr, doc}, dispatch} = view
                                const coordinates = view.posAtCoords({left: event.clientX, top: event.clientY})
                                dispatch(tr.setSelection(TextSelection.create(doc, coordinates!.pos)).scrollIntoView())

                                images.forEach(image => {
                                    editor.commands.uploadImage(image);
                                })

                                return true
                            }
                        },


                        transformPastedHTML(html) {
                            const parser = new DOMParser();
                            const document = parser.parseFromString(html, 'text/html');
                            const workspace = document.documentElement.querySelector('body');
                            if (workspace?.children) {
                                const imgNodes = document.documentElement.querySelectorAll('p > img');
                                for (const image of imgNodes) {
                                    const imageParent = image.parentNode;
                                    const position = Array.prototype.indexOf.call(workspace.children, imageParent);
                                    image.parentElement!.prepend(image);
                                    workspace.insertBefore(image, workspace.children[position]);
                                }
                                return workspace.innerHTML;
                            }
                            return html;
                        },
                    }
                }),
            ]
        },

    }
);