import {Editor, Editor as Tiptap, EditorEvents, EditorOptions, getTextBetween} from "@tiptap/core";

import {Header} from "../components/Header.ts";
import {Footer} from "../components/Footer.ts";

import {getExtensions} from "./getExtensions.ts";

import "../styles"
import {XingHuoModel} from "../ai/xinghuo/XingHuoModel.ts";
import i18next from "i18next";
import {zh} from "../i18n/zh.ts";
import {en} from "../i18n/en.ts";
import {Resource} from "i18next";

// @ts-ignore
import MarkdownIt from 'markdown-it';
import {DOMParser} from "@tiptap/pm/model";


window.customElements.define('aie-menus', Header);
window.customElements.define('aie-footer', Footer);

export interface NameAndValue {
    name: string,
    value: any;
}

export interface AiMenu {
    icon: string,
    name: string,
    prompt: string,
    text: "selected" | "focusBefore",
    model: string,
}

export interface AiCommand {
    name: string,
    keyword: string,
    prompt: string,
    model: string,
}

export interface AiEditorEvent {
    onCreate: (props: EditorEvents['create'], options: AiEditorOptions) => void
    onTransaction: (props: EditorEvents['transaction']) => void
}


export type AiEditorOptions = {
    element: string | Element,
    content?: string,
    contentRetention?: boolean,
    contentRetentionKey?: string,
    lang?: string,
    i18n?: Record<string, Record<string, string>>,
    placeholder?: string,
    theme?: "light" | "dark",
    cbName?: string,
    cbUrl?: string
    onMentionQuery?: (query: string) => any[] | Promise<any[]>,
    onChange?: (editor: AiEditor) => void,
    toolbarKeys?: string[],
    uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
    image?: {
        customMenuInvoke?: (editor: Editor) => void;
        uploadUrl?: string,
        uploadHeaders?: Record<string, any>,
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
    },
    video?: {
        customMenuInvoke?: (editor: Editor) => void;
        uploadUrl?: string,
        uploadHeaders?: Record<string, any>,
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
    },
    attachment?: {
        customMenuInvoke?: (editor: Editor) => void;
        uploadUrl?: string,
        uploadHeaders?: Record<string, any>,
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>,
    },
    fontFamily?: {
        values: NameAndValue[]
    },
    fontSize?: {
        values: NameAndValue[]
    },
    ai?: {
        model: {
            xinghuo?: {
                protocol?: string,
                appId: string,
                apiKey: string,
                apiSecret: string,
                version?: string,
                urlSignatureAlgorithm?: (model: XingHuoModel) => string,
            }
        },
        menus?: AiMenu[],
        commands?: AiCommand[],
        codeBlock?: {
            codeComments?: {
                model: string,
                prompt: string,
            },
            codeExplain?: {
                model: string,
                prompt: string,
            }
        }
    }
}

const defaultOptions: Partial<AiEditorOptions> = {
    theme: "light",
    lang: "zh",
    contentRetentionKey: "ai-editor-content",
    placeholder: "",
}

export class InnerEditor extends Tiptap {

    userOptions: AiEditorOptions;

    constructor(userOptions: AiEditorOptions, options: Partial<EditorOptions> = {}) {
        super(options);
        this.userOptions = userOptions;
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

    innerEditor!: InnerEditor;

    container!: HTMLDivElement;

    menus!: Header;

    footer!: Footer;

    options: AiEditorOptions;

    eventComponents: AiEditorEvent[] = [];

    constructor(_: AiEditorOptions) {
        this.options = Object.assign(defaultOptions, _);
        this.initI18n();
    }

    private initI18n() {
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

        this.container = document.createElement("div");
        this.container.classList.add("aie-container");

        rootEl.appendChild(this.container);


        const mainEl = document.createElement("div");
        mainEl.style.flexGrow = "1";
        mainEl.style.overflow = "auto";

        this.menus = document.createElement("aie-menus") as Header;
        this.footer = document.createElement("aie-footer") as Footer;

        this.eventComponents.push(this.menus);
        this.eventComponents.push(this.footer);

        let content = this.options.content;
        if (this.options.contentRetention && this.options.contentRetentionKey) {
            const cacheContent = localStorage.getItem(this.options.contentRetentionKey);
            if (cacheContent) {
                content = JSON.parse(cacheContent);
            }
        }


        this.innerEditor = new InnerEditor(this.options, {
            element: mainEl,
            content: content,
            extensions: getExtensions(this, this.options),
            onCreate: (props) => this.onCreate(props, mainEl),
            onTransaction: (props) => this.onTransaction(props),
            onDestroy: () => this.onDestroy,
            editorProps: {
                attributes: {
                    class: "aie-content"
                },
            }
        })
    }

    private onCreate(props: EditorEvents['create'], mainEl: Element) {
        this.innerEditor.view.dom.style.height = "calc(100% - 20px)"

        this.eventComponents.forEach((zEvent) => {
            zEvent.onCreate && zEvent.onCreate(props, this.options);
        });

        this.container.appendChild(this.menus);
        this.container.appendChild(mainEl);
        this.container.appendChild(this.footer);
    }

    private onTransaction(props: EditorEvents['transaction']) {
        this.eventComponents.forEach((zEvent) => {
            zEvent.onTransaction && zEvent.onTransaction(props);
        });
        if (props.transaction.docChanged && this.options.onChange) {
            this.options.onChange(this);
        }
        if (props.transaction.docChanged && this.options.contentRetention && this.options.contentRetentionKey) {
            const html = this.innerEditor.getHTML();
            if ("<p></p>" === html || "" === html) {
                localStorage.removeItem(this.options.contentRetentionKey);
            } else {
                localStorage.setItem(this.options.contentRetentionKey, JSON.stringify(this.innerEditor.getJSON()))
            }
        }
    }

    private onDestroy() {
        console.log("AiEditor has destroyed!")
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
                let text = "";
                node.descendants((child) => {
                    if (child.text) {
                        text += child.text;
                    }
                })
                headings.push({
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
        this.innerEditor.commands.focus(pos)
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

    insert(content: string) {
        this.innerEditor.commands.insertContent(content);
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
        this.innerEditor.destroy();
        this.container.remove();
        this.eventComponents = [];
    }

    isDestroyed() {
        return this.innerEditor.isDestroyed;
    }
}
