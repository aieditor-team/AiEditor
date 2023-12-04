import { ChainedCommands } from '@tiptap/core/dist/packages/core/src/types';
import { Editor } from '@tiptap/core';
import { EditorEvents } from '@tiptap/core';
import { EditorOptions } from '@tiptap/core';
import { Fragment } from 'prosemirror-model';
import { JSONContent } from '@tiptap/core';

declare class AbstractMenuButton extends HTMLElement implements AiEditorEvent {
    template: string;
    editor?: Editor;
    options?: AiEditorOptions;
    protected constructor();
    protected registerClickListener(): void;
    connectedCallback(): void;
    onClick(commands: ChainedCommands): void;
    onCreate(props: EditorEvents["create"], options: AiEditorOptions): void;
    onTransaction(event: EditorEvents["transaction"]): void;
    onActive(editor: Editor): boolean;
}

export declare interface AiCommand {
    name: string;
    keyword: string;
    prompt: string;
    model: string;
}

export declare class AiEditor {
    innerEditor: InnerEditor;
    container: HTMLDivElement;
    menus: Header;
    footer: Footer;
    options: AiEditorOptions;
    eventComponents: AiEditorEvent[];
    constructor(_: AiEditorOptions);
    private initI18n;
    private initInnerEditor;
    private onCreate;
    private onTransaction;
    private onDestroy;
    getHtml(): string;
    getJson(): JSONContent;
    getText(): string;
    getMarkdown(): any;
    getOptions(): AiEditorOptions;
    getOutline(): any[];
    focus(): this;
    focusPos(pos: number): this;
    focusStart(): this;
    focusEnd(): this;
    isFocused(): boolean;
    blur(): this;
    insert(content: string): this;
    clear(): this;
    isEmpty(): boolean;
    changeLang(lang: string): this;
    removeRetention(): this;
    destroy(): void;
    isDestroyed(): boolean;
}

export declare interface AiEditorEvent {
    onCreate: (props: EditorEvents['create'], options: AiEditorOptions) => void;
    onTransaction: (props: EditorEvents['transaction']) => void;
}

export declare type AiEditorOptions = {
    element: string | Element;
    content?: string;
    contentRetention?: boolean;
    contentRetentionKey?: string;
    lang?: string;
    i18n?: Record<string, Record<string, string>>;
    placeholder?: string;
    theme?: "light" | "dark";
    cbName?: string;
    cbUrl?: string;
    onMentionQuery?: (query: string) => any[] | Promise<any[]>;
    onChange?: (editor: AiEditor) => void;
    toolbarKeys?: string[];
    uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>;
    image?: {
        customMenuInvoke?: (editor: Editor) => void;
        uploadUrl?: string;
        uploadHeaders?: Record<string, any>;
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>;
    };
    video?: {
        customMenuInvoke?: (editor: Editor) => void;
        uploadUrl?: string;
        uploadHeaders?: Record<string, any>;
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>;
    };
    attachment?: {
        customMenuInvoke?: (editor: Editor) => void;
        uploadUrl?: string;
        uploadHeaders?: Record<string, any>;
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>;
    };
    fontFamily?: {
        values: NameAndValue[];
    };
    fontSize?: {
        values: NameAndValue[];
    };
    ai?: {
        model: {
            xinghuo?: {
                protocol?: string;
                appId: string;
                apiKey: string;
                apiSecret: string;
                version?: string;
                urlSignatureAlgorithm?: (model: XingHuoModel) => string;
            };
        };
        menus?: AiMenu[];
        commands?: AiCommand[];
    };
};

export declare interface AiMenu {
    icon: string;
    name: string;
    prompt: string;
    text: "selected" | "focusBefore";
    model: string;
}

declare interface AiModel {
    start: (seletedText: string, prompt: string, editor: Editor) => void;
}

declare class Footer extends HTMLElement implements AiEditorEvent {
    count: number;
    constructor();
    updateCharacters(): void;
    onCreate(props: EditorEvents["create"], _: AiEditorOptions): void;
    onTransaction(props: EditorEvents["transaction"]): void;
}

declare class Header extends HTMLElement implements AiEditorEvent {
    menuButtons: AbstractMenuButton[];
    constructor();
    connectedCallback(): void;
    onCreate(event: EditorEvents["create"], options: AiEditorOptions): void;
    onTransaction(event: EditorEvents["transaction"]): void;
}

export declare class InnerEditor extends Editor {
    userOptions: AiEditorOptions;
    constructor(userOptions: AiEditorOptions, options?: Partial<EditorOptions>);
    parseHtml(html: string): Fragment;
    parseMarkdown(markdown: string): Fragment;
}

export declare interface NameAndValue {
    name: string;
    value: any;
}

declare class XingHuoModel implements AiModel {
    protocol: string;
    appId: string;
    apiKey: string;
    apiSecret: string;
    version: string;
    urlSignatureAlgorithm: (model: XingHuoModel) => string;
    constructor(options: AiEditorOptions);
    start(seletedText: string, prompt: string, editor: Editor): void;
    createUrl(): string;
}

export { }
