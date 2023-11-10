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
    HTMLAttributes: Record<string, any>,
    uploadUrl?: string,
    uploadHeaders: Record<string, any>,
    uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
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
                    default: 350,
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
                    const id = uuid();
                    const {state: {tr}, view, schema} = this.editor!
                    if (!tr.selection.empty) tr.deleteSelection();

                    view.dispatch(tr.setMeta(actionKey, {
                        type: "add",
                        id,
                        pos: tr.selection.from,
                    }));

                    const uploader = this.options.uploader || getUploader(this.options.uploadUrl!);
                    uploader(file, this.options.uploadUrl!, this.options.uploadHeaders, "image")
                        .then(json => {
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
                            }
                        }).catch(() => {
                        view.dispatch(tr.setMeta(actionKey, {type: "remove", id}));
                    })
                    return true;
                }
            }
        },


        addNodeView() {
            return (e) => {
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

                            // update decorations position
                            set = set.map(tr.mapping, tr.doc);

                            // add decoration
                            if (action && action.type === "add") {
                                set = set.add(tr.doc, [createMediaDecoration(action)]);
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
                        }
                    }
                }),
            ]
        },

    }
);