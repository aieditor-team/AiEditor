import {Node, nodeInputRule} from '@tiptap/core'
import {Plugin, PluginKey, TextSelection} from 'prosemirror-state'
import {resize} from "../util/resize";
import {uuid} from "../util/uuid.ts";
import {DecorationSet} from "prosemirror-view";
import {createMediaDecoration} from "../util/decorations.ts";
import {getUploader} from "../util/getUploader.ts";
import {Uploader, UploaderEvent} from "../core/AiEditor.ts";

export interface VideoOptions {
    HTMLAttributes: Record<string, any>,
    uploadUrl?: string,
    uploadHeaders?: (() => Record<string, any>) | Record<string, any>,
    uploader?: Uploader,
    uploaderEvent?: UploaderEvent,
    uploadFormName?: string,
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        video: {
            setVideo: (src: string) => ReturnType,
            toggleVideo: (src: string) => ReturnType,
            uploadVideo: (file: File) => ReturnType,
        }
    }
}

const VIDEO_INPUT_REGEX = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/

export type VideoAction = {
    type: "add" | "remove";
    id: string;
    pos: number;
}

const key = new PluginKey("aie-video-plugin");
const actionKey = "video_action";

export const VideoExt = Node.create<VideoOptions>({
    name: 'video',
    group: "block",

    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: (el) => {
                    const src = el.getAttribute('src');
                    if (src) return src;
                    const sourceEl = el.querySelector("source");
                    if (sourceEl) {
                        return sourceEl.getAttribute("src");
                    }
                    return null;
                },
                renderHTML: (attrs) => ({src: attrs.src}),
            },
            poster: {
                default: null,
                parseHTML: (el) => el.getAttribute('poster'),
                renderHTML: (attrs) => ({poster: attrs.poster}),
            },
            width: {
                default: 350,
                parseHTML: (element) => `${element.getAttribute('width') ?? ''}`,
            },
            controls: {
                default: true,
                parseHTML: (element) => `${element.getAttribute('controls') ?? 'true'}`,
            },
            autoplay: {
                default: null,
                parseHTML: el => el.hasAttribute('autoplay') ? 'true' : null,
                renderHTML: attrs => attrs.autoplay ? {autoplay: 'autoplay'} : {},
            },
            loop: {
                default: null,
                parseHTML: el => el.hasAttribute('loop') ? 'true' : null,
                renderHTML: attrs => attrs.loop ? {loop: 'loop'} : {},
            },
            muted: {
                default: null,
                parseHTML: el => el.hasAttribute('muted') ? 'true' : null,
                renderHTML: attrs => attrs.muted ? {muted: 'muted'} : {},
            },
            preload: {
                default: null,
                parseHTML: el => el.getAttribute('preload'),
                renderHTML: attrs => attrs.preload ? {preload: attrs.preload} : {},
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'video',
                getAttrs: el => ({
                    src: (el as HTMLVideoElement).getAttribute('src'),
                    poster: (el as HTMLVideoElement).getAttribute('poster'),
                }),
            },
        ]
    },

    renderHTML({HTMLAttributes}) {
        return [
            'video',
            {controls: 'true', ...HTMLAttributes, src: null},
            ['source', {src: HTMLAttributes.src}]
        ]
    },

    addCommands() {
        return {
            setVideo: (src: string) => ({commands}) => commands.insertContent(`<video controls="true" style="width: 100%" src="${src}" />`),
            toggleVideo: () => ({commands}) => commands.toggleNode(this.name, 'paragraph'),
            uploadVideo: (file: File) => () => {

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
                const uploadFormName = this.options.uploadFormName || "video";
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
                            let foundDecorations = decorations.find(void 0, void 0, spec => spec.id == id)

                            let insertPos = foundDecorations[0].from;
                            const $pos = this.editor.state.doc.resolve(foundDecorations[0].from);
                            if (!$pos.nodeBefore) insertPos -= 1;

                            view.dispatch(view.state.tr
                                .insert(insertPos, schema.nodes.video.create({
                                    src: json.data.src,
                                    poster: json.data.poster,
                                    width: json.data.width || 350,
                                    controls: json.data.controls || "true",
                                    autoplay: json.data.autoplay,
                                    loop: json.data.loop,
                                    muted: json.data.muted,
                                    preload: json.data.preload
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


    addNodeView() {
        return (props) => {
            const {src, width, align, controls, poster, autoplay, loop, muted, preload} = props.node.attrs;
            if (!this.editor.isEditable) {
                const container = document.createElement('video');
                container.setAttribute('width', width);
                container.classList.add(`align-${align}`);
                const source = document.createElement('source');
                source.setAttribute('src', src);
                if (controls !== "false") {
                    container.setAttribute('controls', 'controls');
                }
                if (poster) {
                    container.setAttribute('poster', poster);
                }
                if (autoplay) {
                    container.setAttribute('autoplay', "autoplay");
                }
                if (loop) {
                    container.setAttribute('loop', "loop");
                }
                if (muted) {
                    container.setAttribute('muted', "muted");
                    container.muted = true
                }
                if (preload) {
                    container.setAttribute('preload', preload);
                }
                container.appendChild(source);

                return {
                    dom: container
                }
            }
            const videoAttributes = [
                `class="resize-obj"`,
                controls !== "false" ? `controls="controls"` : '',
                width ? `width="${width}"` : '',
                poster ? `poster="${poster}"` : "",
                autoplay ? `autoplay="autoplay"` : "",
                loop ? `loop="loop"` : "",
                muted ? `muted="muted"` : "",
                preload ? `preload="${preload}"` : "",
            ].filter(Boolean).join(' ');
            const container = document.createElement('div')
            container.classList.add(`align-${align}`)
            container.innerHTML = `
                  <div class="aie-resize-wrapper">
                      <div class="aie-resize">
                          <div class="aie-resize-btn-top-left" data-position="left" draggable="true"></div>
                          <div class="aie-resize-btn-top-right" data-position="right" draggable="true"></div>
                          <div class="aie-resize-btn-bottom-left" data-position="left" draggable="true"></div>
                          <div class="aie-resize-btn-bottom-right" data-position="right" draggable="true"></div>
                      </div>
                      <video ${videoAttributes}>
                          <source src="${src}">
                      </video>
                  </div>
                `
            resize(this.editor,
                props.node,
                container,
                (attrs) => this.editor.commands.updateAttributes("video", attrs)
            );
            return {
                dom: container,
            }
        }
    },

    addInputRules() {
        return [
            nodeInputRule({
                find: VIDEO_INPUT_REGEX,
                type: this.type,
                getAttributes: (match) => {
                    const [, , src] = match

                    return {src}
                },
            })
        ]
    },


    addProseMirrorPlugins() {
        const editor = this.editor;
        return [
            new Plugin({
                key: key,
                state: {
                    init: () => DecorationSet.empty,
                    apply: (tr, set) => {

                        const action = tr.getMeta(actionKey) as VideoAction;

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

                            const videos = Array
                                .from(event.dataTransfer.files)
                                .filter(file => (/video/i).test(file.type))

                            if (videos.length === 0) return false

                            event.preventDefault()

                            const {state: {tr, doc}, dispatch} = view
                            const coordinates = view.posAtCoords({left: event.clientX, top: event.clientY})
                            dispatch(tr.setSelection(TextSelection.create(doc, coordinates!.pos)).scrollIntoView())

                            videos.forEach(video => {
                                editor.commands.uploadVideo(video);
                            })

                            return true
                        }
                    }
                }
            }),
        ]
    },


})
