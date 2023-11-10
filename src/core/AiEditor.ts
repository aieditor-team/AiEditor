import {Editor, Editor as Tiptap, EditorEvents} from "@tiptap/core";

import {Header} from "../components/Header.ts";
import {Footer} from "../components/Footer.ts";

import {getExtensions} from "./getExtensions.ts";

import "../styles"

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

export interface AiEditorEvent {
    onCreate: (props: EditorEvents['create'], options: AiEditorOptions) => void
    onTransaction: (props: EditorEvents['transaction']) => void
}


export type AiEditorOptions = {
    element: string | Element,
    content?: string,
    placeHolder?: string,
    theme?: "light" | "dark",
    cbName?: string,
    cbUrl?: string
    onMentionQuery?: (query: string) => any[] | Promise<any[]>,
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
                appId: string,
                apiKey: string,
                apiSecret: string,
                version?: string,
            }
        },
        menus?: AiMenu[],
    }
}

const defaultOptions: Partial<AiEditorOptions> = {
    theme: "light",
    placeHolder: "",
}

export class AiEditor {

    tiptap: Tiptap;

    container: HTMLDivElement;

    menus: Header;

    footer: Footer;

    options: AiEditorOptions;

    eventComponents: AiEditorEvent[] = [];

    constructor(_: AiEditorOptions) {
        this.options = Object.assign(defaultOptions, _);

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

        this.tiptap = new Tiptap({
            element: mainEl,
            content: this.options.content,
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

        // @ts-ignore
        window.editor = this.tiptap;
    }

    onCreate(props: EditorEvents['create'], mainEl: Element) {
        this.tiptap.view.dom.style.height = "calc(100% - 20px)"
        this.eventComponents.forEach((zEvent) => {
            zEvent.onCreate && zEvent.onCreate(props, this.options);
        });

        this.container.appendChild(this.menus);
        this.container.appendChild(mainEl);
        this.container.appendChild(this.footer);
    }

    onTransaction(props: EditorEvents['transaction']) {
        this.eventComponents.forEach((zEvent) => {
            zEvent.onTransaction && zEvent.onTransaction(props);
        });
    }

    onDestroy() {
        while (this.container.firstChild) {
            this.container.firstChild.remove();
        }
    }
}
