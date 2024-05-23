import {Editor as Tiptap, EditorEvents, EditorOptions, Extensions, getTextBetween} from "@tiptap/core";

import {Header} from "../components/Header.ts";
import {Footer} from "../components/Footer.ts";

import {getExtensions} from "./getExtensions.ts";

import "../styles"
import i18next from "i18next";
import {zh} from "../i18n/zh.ts";
import {en} from "../i18n/en.ts";
import {Resource} from "i18next";

import {DOMParser} from "@tiptap/pm/model";
import {AiGlobalConfig} from "../ai/AiGlobalConfig.ts";
import {AiModelManager} from "../ai/AiModelManager.ts";
import {defineCustomElement} from "../commons/defineCustomElement.ts";


defineCustomElement('aie-header', Header);
defineCustomElement('aie-footer', Footer);

export interface NameAndValue {
    name: string,
    value: any;
}

export interface AiEditorEvent {
    onCreate: (props: EditorEvents['create'], options: AiEditorOptions) => void
    onTransaction: (props: EditorEvents['transaction']) => void
}

export interface UploaderEvent {
    onUploadBefore?: (file: File, uploadUrl: string, headers: Record<string, any>) => void | boolean
    onSuccess?: (file: File, response: any) => any
    onFailed?: (file: File, response: any) => void
    onError?: (file: File, err: any) => void
}

export interface CustomMenu {
    id?: string
    className?: string
    icon?: string
    html?: string
    tip?: string
    onClick?: (event: MouseEvent, editor: AiEditor) => void
    onCreate?: (button: HTMLElement, editor: AiEditor) => void
}


export type AiEditorOptions = {
    element: string | Element,
    content?: string,
    contentRetention?: boolean,
    contentRetentionKey?: string,
    lang?: string,
    editable?: boolean,
    i18n?: Record<string, Record<string, string>>,
    placeholder?: string,
    theme?: "light" | "dark",
    cbName?: string,
    cbUrl?: string
    onMentionQuery?: (query: string) => any[] | Promise<any[]>,
    onCreateBefore?: (editor: AiEditor, extensions: Extensions) => void | Extensions,
    onDestroy?: (editor: AiEditor) => void,
    onCreated?: (editor: AiEditor) => void,
    onChange?: (editor: AiEditor) => void,
    onSave?: (editor: AiEditor) => boolean,
    toolbarKeys?: (string | CustomMenu)[],
    textSelectionBubbleMenu?: {
        enable?: boolean,
        elementTagName?:string,
    },
    link?: {
        autolink?: boolean,
        rel?: string,
        class?: string,
    },
    uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
    image?: {
        customMenuInvoke?: (editor: AiEditor) => void;
        uploadUrl?: string,
        uploadHeaders?: (() => Record<string, any>) | Record<string, any>,
        uploadFormName?: string,
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
        uploaderEvent?: UploaderEvent,
        defaultSize?: number,
        allowBase64?: boolean,
    },
    video?: {
        customMenuInvoke?: (editor: AiEditor) => void;
        uploadUrl?: string,
        uploadHeaders?: (() => Record<string, any>) | Record<string, any>,
        uploadFormName?: string,
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
        uploaderEvent?: UploaderEvent,
    },
    attachment?: {
        customMenuInvoke?: (editor: AiEditor) => void;
        uploadUrl?: string,
        uploadHeaders?: (() => Record<string, any>) | Record<string, any>,
        uploadFormName?: string,
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
        uploaderEvent?: UploaderEvent,
    },
    fontFamily?: {
        values: NameAndValue[]
    },
    fontSize?: {
        values: NameAndValue[]
    },
    ai?: AiGlobalConfig,
}

const defaultOptions: Partial<AiEditorOptions> = {
    theme: "light",
    lang: "zh",
    contentRetentionKey: "ai-editor-content",
    editable: true,
    placeholder: "",
}

export class InnerEditor extends Tiptap {

    aiEditor: AiEditor;
    userOptions: AiEditorOptions;

    constructor(aiEditor: AiEditor, editorOptions: AiEditorOptions, options: Partial<EditorOptions> = {}) {
        super(options);
        this.aiEditor = aiEditor;
        this.userOptions = editorOptions;
    }

    parseHtml(html: string) {
        function bodyElement(value: string): HTMLElement {
            return new window.DOMParser().parseFromString(`<body>${value}</body>`, 'text/html').body
        }

        const parser = DOMParser.fromSchema(this.schema);
        return parser.parse(bodyElement(html), {}).content;
    }

    parseMarkdown(markdown: string) {
        const html = this.storage.markdown?.parser?.parse?.(markdown, {
            inline: false,
        });
        return this.parseHtml(html);
    }
}

export class AiEditor {

    private customLayout: boolean = false;

    innerEditor!: InnerEditor;

    container!: HTMLDivElement;

    header!: Header;

    mainEl!: HTMLDivElement;

    footer!: Footer;

    options: AiEditorOptions;

    eventComponents: AiEditorEvent[] = [];

    constructor(_: AiEditorOptions) {
        this.options = {...defaultOptions, ..._};
        this.initI18nAndInnerEditor();
    }

    private initI18nAndInnerEditor() {
        const i18nConfig = this.options.i18n || {};
        const resources = {
            en: {translation: {...en, ...i18nConfig.en}},
            zh: {translation: {...zh, ...i18nConfig.zh}},
        } as Resource;

        //fill the resources but en and zh
        for (let key of Object.keys(i18nConfig)) {
            if (key != "en" && key != "zh") {
                resources[key] = {
                    translation: {...i18nConfig[key]}
                }
            }
        }
        i18next.init({
            lng: this.options.lang, resources,
        }, (_err, _t) => {
            this.initInnerEditor();
        })
    }

    private initInnerEditor() {
        const rootEl = typeof this.options.element === "string"
            ? document.querySelector(this.options.element) as Element : this.options.element;

        //set the editor theme class
        rootEl.classList.add(`aie-theme-${this.options.theme}`);


        this.container = rootEl.querySelector(".aie-container")!;
        if (!this.container) {
            this.container = document.createElement("div");
            this.container.classList.add("aie-container");
        } else {
            this.customLayout = true;
        }

        rootEl.appendChild(this.container);

        this.mainEl = document.createElement("div");
        this.mainEl.style.flexGrow = "1";
        this.mainEl.style.overflow = "auto";

        this.header = document.createElement("aie-header") as Header;
        this.footer = document.createElement("aie-footer") as Footer;

        this.eventComponents.push(this.header);
        this.eventComponents.push(this.footer);

        let content = this.options.content;
        if (this.options.contentRetention && this.options.contentRetentionKey) {
            const cacheContent = localStorage.getItem(this.options.contentRetentionKey);
            if (cacheContent) {
                content = JSON.parse(cacheContent);
            }
        }

        let extensions = getExtensions(this, this.options);
        if (this.options.onCreateBefore) {
            const newExtensions = this.options.onCreateBefore(this, extensions);
            if (!newExtensions) extensions = newExtensions!;
        }

        this.innerEditor = new InnerEditor(this, this.options, {
            element: this.mainEl,
            content: content,
            editable: this.options.editable,
            extensions: extensions,
            onCreate: (props) => this.onCreate(props),
            onTransaction: (props) => this.onTransaction(props),
            onDestroy: () => this.onDestroy,
            editorProps: {
                attributes: {
                    class: "aie-content"
                },
            }
        })
    }

    private onCreate(props: EditorEvents['create']) {
        this.innerEditor.view.dom.style.height = "calc(100% - 20px)"

        this.eventComponents.forEach((zEvent) => {
            zEvent.onCreate && zEvent.onCreate(props, this.options);
        });

        const _header = this.container.querySelector(".aie-container-header") || this.container;
        _header.appendChild(this.header);

        const _main = this.container.querySelector(".aie-container-main") || this.container;
        _main.appendChild(this.mainEl);

        const _footer = this.container.querySelector(".aie-container-footer") || this.container;
        _footer.appendChild(this.footer);

        if (this.options.ai) {
            AiModelManager.init(this.innerEditor, this.options.ai);
        }

        if (this.options.onCreated) {
            this.options.onCreated(this);
        }
    }

    private onTransaction(transEvent: EditorEvents['transaction']) {
        this.eventComponents.forEach((component) => {
            component.onTransaction && component.onTransaction(transEvent);
        });

        if (transEvent.transaction.getMeta("ignoreChanged")) {
            return;
        }

        if (transEvent.transaction.docChanged && this.options.onChange) {
            this.options.onChange(this);
        }
        if (transEvent.transaction.docChanged && this.options.contentRetention && this.options.contentRetentionKey) {
            const html = this.innerEditor.getHTML();
            if ("<p></p>" === html || "" === html) {
                localStorage.removeItem(this.options.contentRetentionKey);
            } else {
                localStorage.setItem(this.options.contentRetentionKey, JSON.stringify(this.innerEditor.getJSON()))
            }
        }
    }

    private onDestroy() {
    }

    getHtml() {
        return this.innerEditor.getHTML();
    }

    getJson() {
        return this.innerEditor.getJSON();
    }

    getText() {
        return this.innerEditor.getText();
    }

    getSelectedText() {
        const selection = this.innerEditor.state.selection;
        if (selection.empty) return "";
        return getTextBetween(this.innerEditor.state.doc, {from: selection.from, to: selection.to})
    }

    getMarkdown() {
        return this.innerEditor.storage.markdown.getMarkdown();
    }

    getOptions() {
        return this.options;
    }

    getOutline() {
        const doc = this.innerEditor.state.doc;
        const headings = [] as any[];
        doc.descendants((node, pos) => {
            if (node.type.name === "heading") {

                const id = `aie-heading-${headings.length + 1}`
                if (node.attrs.id !== id) {
                    const {state: {tr}, view: {dispatch}} = this.innerEditor
                    dispatch(tr.setNodeMarkup(pos, void 0, {
                        ...node.attrs,
                        id,
                    }).setMeta("ignoreChanged", true))
                }

                let text = "";
                node.descendants((child) => {
                    if (child.text) {
                        text += child.text;
                    }
                })

                headings.push({
                    id: id,
                    text: text,
                    level: node.attrs.level,
                    pos: pos,
                    size: node.nodeSize,
                })
            }
        })
        return headings;
    }

    focus() {
        this.innerEditor.commands.focus();
        return this;
    }

    focusPos(pos: number) {
        this.innerEditor.commands.focus(pos);
        return this;
    }

    focusStart() {
        this.innerEditor.commands.focus("start");
        return this;
    }

    focusEnd() {
        this.innerEditor.commands.focus("end");
        return this;
    }

    isFocused() {
        return this.innerEditor.isFocused;
    }

    blur() {
        this.innerEditor.commands.blur();
        return this;
    }

    insert(content: any) {
        this.innerEditor.commands.insertContent(content);
        return this;
    }

    setEditable(editable: boolean) {
        this.innerEditor.setEditable(editable, true);
        return this;
    }

    setContent(content: string) {
        this.focus().clear().insert(content);
        return this;
    }

    clear() {
        this.innerEditor.commands.clearContent(true);
        return this;
    }

    isEmpty() {
        return this.innerEditor.isEmpty;
    }

    changeLang(lang: string) {
        this.destroy();
        this.options.lang = lang;
        i18next.changeLanguage(lang);
        this.initInnerEditor();
        return this;
    }

    removeRetention() {
        this.options.contentRetentionKey && localStorage.removeItem(this.options.contentRetentionKey);
        return this;
    }

    destroy() {
        this.options.onDestroy?.(this);
        this.innerEditor.destroy();
        this.eventComponents = [];

        //custom layout
        if (this.customLayout) {
            this.header.remove();
            this.mainEl.remove();
            this.footer.remove();
        } else {
            this.container.remove();
        }
    }

    isDestroyed() {
        return this.innerEditor.isDestroyed;
    }
}
