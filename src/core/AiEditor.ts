import {Editor, Editor as Tiptap, EditorEvents, EditorOptions} from "@tiptap/core";

import {Header} from "../components/Header.ts";
import {Footer} from "../components/Footer.ts";

import {getExtensions} from "./getExtensions.ts";

import "../styles"
import {XingHuoModel} from "../ai/xinghuo/XingHuoModel.ts";
import i18next from "i18next";
import {zh} from "../i18n/zh.ts";
import {en} from "../i18n/en.ts";
import {Resource} from "i18next";
import {MarkdownParser} from "@tiptap/pm/markdown";

// @ts-ignore
import MarkdownIt from 'markdown-it';
import {Fragment} from "@tiptap/pm/model";


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

    md: MarkdownIt;

    markdownParser!: MarkdownParser;

    constructor(userOptions: AiEditorOptions, options: Partial<EditorOptions> = {}) {
        super(options);
        this.userOptions = userOptions;
    }

    initMarkdownParse() {
        function listIsTight(tokens: any, i: any) {
            while (++i < tokens.length)
                if (tokens[i].type != "list_item_open")
                    return tokens[i].hidden;
            return false;
        }

        this.md = MarkdownIt("commonmark", {html: false}).enable("strikethrough");
        // this.md = MarkdownIt("commonmark", {});
        // debugger
        this.markdownParser = new MarkdownParser(this.schema, this.md, {
            blockquote: {block: "blockquote"},
            paragraph: {block: "paragraph"},
            list_item: {block: "listItem"},
            list_item_open: {block: "listItem"},
            bullet_list: {block: "bulletList", getAttrs: (_, tokens, i) => ({tight: listIsTight(tokens, i)})},
            ordered_list: {
                block: "orderedList", getAttrs: (tok, tokens, i) => ({
                    order: +tok.attrGet("start") || 1,
                    tight: listIsTight(tokens, i)
                })
            },
            ordered_list_open: {block: "orderedList", getAttrs: tok => ({level: +tok.tag.slice(1)})},
            heading: {block: "heading", getAttrs: tok => ({level: +tok.tag.slice(1)})},
            code_block: {
                block: "codeBlock", getAttrs: tok => {
                    return {language: tok.info || ""}
                }, noCloseToken: true
            },
            fence: {
                block: "codeBlock", getAttrs: tok => {
                    return {language: tok.info || ""}
                }, noCloseToken: true
            },
            hr: {node: "horizontalRule"},
            image: {
                node: "image", getAttrs: tok => ({
                    src: tok.attrGet("src"),
                    title: tok.attrGet("title") || null,
                    alt: tok.children[0] && tok.children[0].content || null
                })
            },
            hardbreak: {node: "hardBreak"},
            em: {mark: "italic"},
            s: {mark: "strike"},
            strong: {mark: "bold"},
            link: {
                mark: "link", getAttrs: tok => ({
                    href: tok.attrGet("href"),
                    title: tok.attrGet("title") || null
                })
            },
            code_inline: {mark: "code", noCloseToken: true}
        });
    }

    parseMarkdown(markdown: string) {
        try {
            const marked = this.markdownParser.parse(markdown);
            if (!marked) {
                return null;
            }
            let isMarkdown = false;
            marked.descendants((node) => {
                if (isMarkdown) {
                    return false;
                } else if (node.type.name !== "paragraph"
                    && node.type.name !== "text") {
                    isMarkdown = true;
                    return false;
                } else if (node.marks && node.marks.length > 0) {
                    isMarkdown = true;
                    return false;
                }
            });
            return isMarkdown ? Fragment.fromJSON(this.schema, marked!.toJSON().content) : null;
        } catch (e) {
            console.error("Can not parse markdown")
            return null;
        }
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
        this.innerEditor.initMarkdownParse()

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

    getOptions() {
        return this.options;
    }


    focus() {
        this.innerEditor.commands.focus();
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

    insertHtml(html: string) {
        this.innerEditor.commands.insertContent(html);
        return this;
    }

    insertMarkdown(markdown: string) {
        const fragment = this.innerEditor.parseMarkdown(markdown);
        if (fragment) {
            const {state: {tr, selection}, view} = this.innerEditor!
            view.dispatch(tr.replaceWith(selection.from, selection.to, fragment));
        } else {
            this.insertHtml(markdown);
        }
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
