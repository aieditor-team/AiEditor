import {MarkdownParser} from "@tiptap/pm/markdown";
import { Schema } from "@tiptap/pm/model";
// @ts-ignore
import MarkdownIt from 'markdown-it';

export class AbstractWebSocket {

    url: string;
    webSocket?: WebSocket;
    isOpen: boolean = false;
    text?: string;
    markdownParser: MarkdownParser;

    constructor(url: string, schema:Schema) {
        this.url = url;
        function listIsTight(tokens: any, i: any) {
            while (++i < tokens.length)
                if (tokens[i].type != "list_item_open")
                    return tokens[i].hidden;
            return false;
        }
        this.markdownParser = new MarkdownParser(schema, MarkdownIt("commonmark", {html: false}), {
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
            em: {mark: "em"},
            strong: {mark: "strong"},
            link: {
                mark: "link", getAttrs: tok => ({
                    href: tok.attrGet("href"),
                    title: tok.attrGet("title") || null
                })
            },
            code_inline: {mark: "code", noCloseToken: true}
        });
    }

    start(text: string) {
        this.text = text;
        this.webSocket = new WebSocket(this.url);
        this.webSocket.onopen = (e) => this.onOpen(e)
        this.webSocket.onmessage = (e) => this.onMessage(e)
        this.webSocket.onclose = (e) => this.onClose(e)
        this.webSocket.onerror = (e) => this.onError(e)
    }

    stop() {
        if (this.webSocket) {
            this.webSocket.close();
            this.webSocket = void 0;
        }
    }

    send(message: string) {
        if (this.webSocket && this.isOpen) {
            this.webSocket.send(message);
        }
    }

    protected onOpen(_: Event) {
        this.isOpen = true;
        this.send(this.text!);
    }

    protected onMessage(_: MessageEvent) {
    }

    protected onClose(_: CloseEvent) {
        this.isOpen = false;
    }

    protected onError(_: Event) {
        this.isOpen = false;
    }
}