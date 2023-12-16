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
    header: Header;
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
    getSelectedText(): string;
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
    onCreated?: (editor: AiEditor) => void;
    onChange?: (editor: AiEditor) => void;
    toolbarKeys?: (string | CustomMenu)[];
    link?: {
        autolink?: boolean;
        rel?: string;
        class?: string;
    };
    uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>;
    image?: {
        customMenuInvoke?: (editor: AiEditor) => void;
        uploadUrl?: string;
        uploadHeaders?: Record<string, any>;
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>;
        uploaderEvent?: UploaderEvent;
        defaultSize?: number;
        allowBase64: boolean;
    };
    video?: {
        customMenuInvoke?: (editor: AiEditor) => void;
        uploadUrl?: string;
        uploadHeaders?: Record<string, any>;
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>;
        uploaderEvent?: UploaderEvent;
    };
    attachment?: {
        customMenuInvoke?: (editor: AiEditor) => void;
        uploadUrl?: string;
        uploadHeaders?: Record<string, any>;
        uploader?: (file: File, uploadUrl: string, headers: Record<string, any>, formName: string) => Promise<Record<string, any>>;
        uploaderEvent?: UploaderEvent;
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
        codeBlock?: {
            codeComments?: {
                model: string;
                prompt: string;
            };
            codeExplain?: {
                model: string;
                prompt: string;
            };
        };
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
    start: (selectedText: string, prompt: string, editor: Editor, options?: AiModelParseOptions) => void;
}

declare interface AiModelParseOptions {
    markdownParseEnable?: boolean;
    useMarkdownTextOnly?: boolean;
}

export declare interface CustomMenu {
    icon?: string;
    html?: string;
    onClick?: (event: MouseEvent, editor: AiEditor) => void;
    tip?: string;
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
    aiEditor: AiEditor;
    userOptions: AiEditorOptions;
    constructor(aiEditor: AiEditor, editorOptions: AiEditorOptions, options?: Partial<EditorOptions>);
    parseHtml(html: string): Fragment;
    parseMarkdown(markdown: string): Fragment;
}

export declare interface NameAndValue {
    name: string;
    value: any;
}

export declare interface UploaderEvent {
    onBeforeUpload: (file: File, uploadUrl: string, headers: Record<string, any>) => void;
    onSuccess: (file: File, response: any) => any;
    onFailed: (file: File, response: any) => void;
    onError: (file: File, err: any) => void;
}

declare class XingHuoModel implements AiModel {
    protocol: string;
    appId: string;
    apiKey: string;
    apiSecret: string;
    version: string;
    urlSignatureAlgorithm: (model: XingHuoModel) => string;
    constructor(options: AiEditorOptions);
    start(selectedText: string, prompt: string, editor: Editor, options?: AiModelParseOptions): void;
    createUrl(): string;
}

export { }
