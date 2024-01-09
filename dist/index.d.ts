import { ChainedCommands } from '@tiptap/core/dist/packages/core/src/types';
import { Editor } from '@tiptap/core';
import { EditorEvents } from '@tiptap/core';
import { EditorOptions } from '@tiptap/core';
import { Extensions } from '@tiptap/core';
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

declare interface AiClient {
    start: (message: string) => void;
    stop: () => void;
}

export declare class AiEditor {
    private customLayout;
    innerEditor: InnerEditor;
    container: HTMLDivElement;
    header: Header;
    mainEl: HTMLDivElement;
    footer: Footer;
    options: AiEditorOptions;
    eventComponents: AiEditorEvent[];
    constructor(_: AiEditorOptions);
    private initI18nAndInnerEditor;
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
    insert(content: any): this;
    setEditable(editable: boolean): this;
    setContent(content: string): this;
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
    editable?: boolean;
    i18n?: Record<string, Record<string, string>>;
    placeholder?: string;
    theme?: "light" | "dark";
    cbName?: string;
    cbUrl?: string;
    onMentionQuery?: (query: string) => any[] | Promise<any[]>;
    onCreateBefore?: (editor: AiEditor, extensions: Extensions) => void | Extensions;
    onDestroy?: (editor: AiEditor) => void;
    onCreated?: (editor: AiEditor) => void;
    onChange?: (editor: AiEditor) => void;
    onSave?: (editor: AiEditor) => boolean;
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
    ai?: AiGlobalConfig;
};

declare interface AiGlobalConfig {
    models: Record<string, AiModelConfig>;
    modelFactory?: AiModelFactory;
    onTokenConsume?: (modelName: string, modelConfig: AiModelConfig, count: number) => void;
    onCreateClientUrl?: (modelName: string, modelConfig: AiModelConfig, onFinished: (url: string) => void) => void;
    bubblePanelEnable?: boolean;
    bubblePanelModel?: string;
    menus?: AiMenu[];
    commands?: AiMenu[];
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
}

declare interface AiMenu {
    icon: string;
    name: string;
    prompt?: string;
    text?: "selected" | "focusBefore";
    model?: string;
    children?: AiMenu[];
}

declare interface AiMessage {
    role: string;
    content: string;
    index: number;
    status: 0 | 1 | 2;
}

declare interface AiMessageListener {
    onStart: (aiClient: AiClient) => void;
    onStop: () => void;
    onMessage: (message: AiMessage) => void;
}

declare abstract class AiModel {
    editor: Editor;
    globalConfig: AiGlobalConfig;
    aiModelName: string;
    aiModelConfig: AiModelConfig;
    constructor(editor: Editor, globalConfig: AiGlobalConfig, aiModelName: string);
    chat(selectedText: string, prompt: string, listener: AiMessageListener): void;
    /**
     * 创建客户端链接 URL
     */
    abstract createAiClientUrl(): string;
    /**
     * 创建客户端
     */
    abstract createAiClient(url: string, listener: AiMessageListener): AiClient;
    /**
     * 封装消息，把 prompt 转换为协议需要的格式
     * @param promptMessage
     */
    abstract wrapMessage(promptMessage: string): any;
}

declare interface AiModelConfig {
}

declare interface AiModelFactory {
    create: (name: string, editor: Editor, globalConfig: AiGlobalConfig) => AiModel;
}

export declare class AiModelManager {
    private static models;
    static init(editor: Editor, globalConfig: AiGlobalConfig): void;
    static get(modelName: string): AiModel;
    static set(modelName: string, aiModel: AiModel): void;
}

export declare interface CustomMenu {
    id?: string;
    className?: string;
    icon?: string;
    html?: string;
    tip?: string;
    onClick?: (event: MouseEvent, editor: AiEditor) => void;
    onCreate?: (button: HTMLElement, editor: AiEditor) => void;
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

export declare class SparkAiModel extends AiModel {
    constructor(editor: Editor, globalConfig: AiGlobalConfig);
    createAiClient(url: string, listener: AiMessageListener): AiClient;
    wrapMessage(promptMessage: string): string;
    private getDomain;
    createAiClientUrl(): string;
}

export declare interface UploaderEvent {
    onUploadBefore: (file: File, uploadUrl: string, headers: Record<string, any>) => void | boolean;
    onSuccess: (file: File, response: any) => any;
    onFailed: (file: File, response: any) => void;
    onError: (file: File, err: any) => void;
}

export { }
