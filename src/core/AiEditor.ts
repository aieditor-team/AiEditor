import {
    Editor as Tiptap,
    EditorEvents,
    EditorOptions,
    Extensions,
    getTextBetween,
    SingleCommands,
    ChainedCommands
} from "@tiptap/core";

import {Header} from "../components/Header.ts";
import {Footer} from "../components/Footer.ts";

import {getExtensions} from "./getExtensions.ts";

import "../styles"
// i18n
import i18next from "i18next";
import {zh} from "../i18n/zh.ts";
import {en} from "../i18n/en.ts";
import {de} from "../i18n/de.ts";
import {pt} from "../i18n/pt.ts";
import {es} from "../i18n/es.ts";
import {hi} from "../i18n/hi.ts";
import {id} from "../i18n/id.ts";
import {ja} from "../i18n/ja.ts";
import {ko} from "../i18n/ko.ts";
import {th} from "../i18n/th.ts";
import {vi} from "../i18n/vi.ts";
import {Resource} from "i18next";

import {DOMParser} from "@tiptap/pm/model";
import {AiGlobalConfig} from "../ai/AiGlobalConfig.ts";
import {AiModelManager} from "../ai/AiModelManager.ts";
import {defineCustomElement} from "../commons/defineCustomElement.ts";
import {BubbleMenuItem} from "../components/bubbles/types.ts";
import {LanguageItem} from "../extensions/CodeBlockExt.ts";
import {Transaction} from "@tiptap/pm/state";
import {DefaultToolbarKey} from "../components/DefaultToolbarKeys.ts";
import {htmlToMd, mdToHtml} from "../util/mdUtil.ts";

defineCustomElement('aie-header', Header);
defineCustomElement('aie-footer', Footer);

export interface NameAndValue {
    name: string,
    value: any;
}

export interface AiEditorEvent {
    onCreate: (props: EditorEvents['create'], options: AiEditorOptions) => void
    onTransaction: (props: EditorEvents['transaction']) => void
    onEditableChange: (editable: boolean) => void
}


export type Uploader = (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>;

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

export interface MenuGroup {
    title?: string,
    icon?: string,
    toolbarKeys: (string | CustomMenu | MenuGroup)[],
}

export interface HtmlPasteConfig {
    pasteAsText?: boolean,
    pasteClean?: boolean
    removeEmptyParagraphs?: boolean,
    pasteProcessor?: (html: string) => string
}


export type AiEditorOptions = {
    element: string | Element,
    content?: string,
    contentIsMarkdown?: boolean,
    contentRetention?: boolean,
    contentRetentionKey?: string,
    lang?: string,
    editable?: boolean,
    i18n?: Record<string, Record<string, string>>,
    placeholder?: string,
    theme?: "light" | "dark",
    onMentionQuery?: (query: string) => any[] | Promise<any[]>,
    onCreateBefore?: (editor: AiEditor, extensions: Extensions) => void | Extensions,
    onCreated?: (editor: AiEditor) => void,
    onChange?: (editor: AiEditor) => void,
    onTransaction?: (editor: AiEditor, transaction: Transaction) => void,
    onFocus?: (editor: AiEditor) => void,
    onBlur?: (editor: AiEditor) => void,
    onDestroy?: (editor: AiEditor) => void,
    onSave?: (editor: AiEditor) => boolean,
    toolbarKeys?: (string | CustomMenu | MenuGroup)[],
    toolbarExcludeKeys?: DefaultToolbarKey[],
    toolbarSize?: 'small' | 'medium' | 'large',
    draggable?: boolean,
    htmlPasteConfig?: HtmlPasteConfig,
    codeBlock?: {
        languages?: LanguageItem[],
        codeExplainPrompt?: string,
        codeCommentsPrompt?: string,
    },
    textSelectionBubbleMenu?: {
        enable?: boolean,
        elementTagName?: string,
        items?: (string | BubbleMenuItem)[],
    },
    link?: {
        autolink?: boolean,
        rel?: string,
        class?: string,
        bubbleMenuItems?: (string | BubbleMenuItem)[],
    },
    uploader?: Uploader,
    image?: {
        customMenuInvoke?: (editor: AiEditor) => void;
        uploadUrl?: string,
        uploadHeaders?: (() => Record<string, any>) | Record<string, any>,
        uploadFormName?: string,
        uploader?: Uploader,
        uploaderEvent?: UploaderEvent,
        defaultSize?: number,
        allowBase64?: boolean,
        bubbleMenuEnable?: boolean,
        bubbleMenuItems?: (string | BubbleMenuItem)[],
    },
    video?: {
        customMenuInvoke?: (editor: AiEditor) => void;
        uploadUrl?: string,
        uploadHeaders?: (() => Record<string, any>) | Record<string, any>,
        uploadFormName?: string,
        uploader?: Uploader,
        uploaderEvent?: UploaderEvent,
    },
    attachment?: {
        customMenuInvoke?: (editor: AiEditor) => void;
        uploadUrl?: string,
        uploadHeaders?: (() => Record<string, any>) | Record<string, any>,
        uploadFormName?: string,
        uploader?: Uploader,
        uploaderEvent?: UploaderEvent,
    },
    fontFamily?: {
        values: NameAndValue[]
    },
    fontSize?: {
        defaultValue?: number,
        values?: NameAndValue[]
    },
    lineHeight?: {
        values?: string[]
    },
    emoji?: {
        values?: string[]
    },
    textCounter?: (text: string) => number,
    ai?: AiGlobalConfig,
}

const defaultOptions: Partial<AiEditorOptions> = {
    theme: "light",
    lang: "zh",
    contentRetentionKey: "ai-editor-content",
    editable: true,
    draggable: true,
    placeholder: "",
    toolbarSize: 'small',
}

export class InnerEditor extends Tiptap {

    aiEditor: AiEditor;

    constructor(aiEditor: AiEditor, options: Partial<EditorOptions> = {}) {
        super(options);
        this.aiEditor = aiEditor;
    }

    parseHtml(html: string) {
        function bodyElement(value: string): HTMLElement {
            return new window.DOMParser().parseFromString(`<body>${value}</body>`, 'text/html').body
        }

        const parser = DOMParser.fromSchema(this.schema);
        return parser.parse(bodyElement(html), {}).content;
    }

    parseMarkdown(markdown: string) {
        const html = mdToHtml(markdown);
        return this.parseHtml(html);
    }

    insertMarkdown(markdown: string) {
        this.commands.insertContent(mdToHtml(markdown))
    }
}

export class AiEditor {

    customLayout: boolean = false;

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
            de: {translation: {...de, ...i18nConfig.de}},
            en: {translation: {...en, ...i18nConfig.en}},
            pt: {translation: {...pt, ...i18nConfig.pt}},
            zh: {translation: {...zh, ...i18nConfig.zh}},
            es: {translation: {...es, ...i18nConfig.es}},
            hi: {translation: {...hi, ...i18nConfig.hi}},
            id: {translation: {...id, ...i18nConfig.id}},
            ja: {translation: {...ja, ...i18nConfig.ja}},
            ko: {translation: {...ko, ...i18nConfig.ko}},
            th: {translation: {...th, ...i18nConfig.th}},
            vi: {translation: {...vi, ...i18nConfig.vi}},
        } as Resource;

        //fill the resources but de, en, pt and zh
        for (let key of Object.keys(i18nConfig)) {
            if (key != "de" && key != "en" && key != "pt" && key != "zh") {
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

    protected initInnerEditor() {
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

        this.header = new Header();
        this.eventComponents.push(this.header);

        this.footer = new Footer();
        this.footer.initDraggable(this.options.draggable)
        this.eventComponents.push(this.footer);

        let content = this.options.content;
        if (this.options.contentRetention && this.options.contentRetentionKey) {
            const cacheContent = localStorage.getItem(this.options.contentRetentionKey);
            if (cacheContent) {
                try {
                    content = JSON.parse(cacheContent);
                } catch (e) {
                    console.error(e, "Can not parse the cache content from localStorage.");
                }
            }
        }

        this.innerEditor = new InnerEditor(this, {
            element: this.mainEl,
            content: this.options.contentIsMarkdown === true && typeof content === "string" ? mdToHtml(content) : content,
            editable: this.options.editable,
            extensions: this.getExtensions(),
            onCreate: (props) => this.onCreate(props),
            onTransaction: (props) => this.onTransaction(props),
            onFocus: () => this.options?.onFocus?.(this),
            onBlur: () => this.options?.onBlur?.(this),
            onDestroy: () => this.options?.onDestroy?.(this),
            editorProps: {
                attributes: {
                    class: "aie-content"
                },
            }
        })
    }


    protected getExtensions() {
        let extensions = getExtensions(this, this.options);
        if (this.options.onCreateBefore) {
            const newExtensions = this.options.onCreateBefore(this, extensions);
            if (newExtensions) extensions = newExtensions;
        }
        return extensions;
    }


    protected onCreate(props: EditorEvents['create']) {
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

    protected onTransaction(transEvent: EditorEvents['transaction']) {
        this.eventComponents.forEach((component) => {
            component.onTransaction && component.onTransaction(transEvent);
        });

        if (transEvent.transaction.getMeta("ignoreChanged")) {
            return;
        }

        this.options.onTransaction?.(this, transEvent.transaction);

        if (transEvent.transaction.docChanged && this.options.onChange) {
            this.options.onChange(this);
        }

        if (transEvent.transaction.docChanged && this.options.contentRetention && this.options.contentRetentionKey) {
            const html = transEvent.editor.getHTML();
            if ("<p></p>" === html || "" === html) {
                localStorage.removeItem(this.options.contentRetentionKey);
            } else {
                const json = transEvent.editor.getJSON();
                localStorage.setItem(this.options.contentRetentionKey, JSON.stringify(json))
            }
        }
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
        return htmlToMd(this.getHtml())
    }

    getOptions() {
        return this.options;
    }

    getAttributes(name: string) {
        return this.innerEditor.getAttributes(name);
    }

    setAttributes(name: string, attributes: Record<string, any>) {
        this.innerEditor.commands.updateAttributes(name, attributes);
    }

    isActive(nameOrAttrs: any, attrs?: {}) {
        if (typeof nameOrAttrs === "object" || !attrs) {
            return this.innerEditor.isActive(nameOrAttrs);
        } else {
            return this.innerEditor.isActive(nameOrAttrs, attrs);
        }
    }

    commands(): SingleCommands {
        return this.innerEditor.commands;
    }

    commandsChain(): ChainedCommands {
        return this.innerEditor.chain()
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

    insertMarkdown(content: string) {
        this.innerEditor.insertMarkdown(content)
        return this;
    }

    setEditable(editable: boolean) {
        this.options.editable = editable;
        this.innerEditor.setEditable(editable, true);
        this.eventComponents.forEach((ec) => {
            ec.onEditableChange(editable)
        })
        return this;
    }

    setContent(content: string) {
        this.focus().clear().insert(content);
        return this;
    }

    setMarkdownContent(content: string) {
        const html = mdToHtml(content)
        return this.setContent(html);
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
