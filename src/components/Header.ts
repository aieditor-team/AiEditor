import {AiEditorOptions, AiEditorEvent} from "../core/AiEditor.ts";
import {EditorEvents} from "@tiptap/core";
import {Undo} from "./menus/Undo";
import {AbstractMenuButton} from "./AbstractMenuButton.ts";
import {Redo} from "./menus/Redo";
import {Heading} from "./menus/Heading.ts";
import {FontFamily} from "./menus/FontFamily";
import {FontSize} from "./menus/FontSize";
import {Bold} from "./menus/Bold";
import {Italic} from "./menus/Italic";
import {Underline} from "./menus/Underline";
import {Strike} from "./menus/Strike";
import {Subscript} from "./menus/Subscript";
import {Superscript} from "./menus/Superscript";
import {Highlight} from "./menus/Highlight";
import {FontColor} from "./menus/FontColor";
import {Divider} from "./menus/Divider";
import {BulletList} from "./menus/BulletList";
import {OrderedList} from "./menus/OrderedList";
import {IndentDecrease} from "./menus/IndentDecrease";
import {IndentIncrease} from "./menus/IndentIncrease";
import {Align} from "./menus/Align";
import {Link} from "./menus/Link";
import {SourceCode} from "./menus/SourceCode";
import {Todo} from "./menus/Todo";
import {LineHeight} from "./menus/LineHeight";
import {Quote} from "./menus/Quote";
import {Image} from "./menus/Image";
import {Video} from "./menus/Video";
import {Code} from "./menus/Code";
import {CodeBlock} from "./menus/CodeBlock";
import {Eraser} from "./menus/Eraser";
import {Hr} from "./menus/Hr";
import {Table} from "./menus/Table";
import {Break} from "./menus/Break";
import {Attachment} from "./menus/Attachment";
import {Fullscreen} from "./menus/Fullscreen";
import {Printer} from "./menus/Printer";
import {Emoji} from "./menus/Emoji";
import {Painter} from "./menus/Painter";
import {Ai} from "./menus/Ai.ts";
import {Container} from "./menus/Container.ts";
import {Custom} from "./menus/Custom.ts";
import {defineCustomElement} from "../commons/defineCustomElement.ts";
import {Group} from "./menus/Group.ts";
import {initToolbarKeys} from "../util/initToolbarKeys.ts";

defineCustomElement('aie-undo', Undo);
defineCustomElement('aie-undo', Undo);
defineCustomElement('aie-redo', Redo);
defineCustomElement('aie-brush', Painter);
defineCustomElement('aie-container', Container);
defineCustomElement('aie-custom', Custom);
defineCustomElement('aie-eraser', Eraser);
defineCustomElement('aie-heading', Heading);
defineCustomElement('aie-font-family', FontFamily);
defineCustomElement('aie-font-size', FontSize);
defineCustomElement('aie-bold', Bold);
defineCustomElement('aie-italic', Italic);
defineCustomElement('aie-underline', Underline);
defineCustomElement('aie-strike', Strike);
defineCustomElement('aie-link', Link);
defineCustomElement('aie-source-code', SourceCode);
defineCustomElement('aie-code', Code);
defineCustomElement('aie-subscript', Subscript);
defineCustomElement('aie-superscript', Superscript);
defineCustomElement('aie-highlight', Highlight);
defineCustomElement('aie-font-color', FontColor);
defineCustomElement('aie-divider', Divider);
defineCustomElement('aie-bullet-list', BulletList);
defineCustomElement('aie-ordered-list', OrderedList);
defineCustomElement('aie-indent-decrease', IndentDecrease);
defineCustomElement('aie-indent-increase', IndentIncrease);
defineCustomElement('aie-align', Align);
defineCustomElement('aie-todo', Todo);
defineCustomElement('aie-line-height', LineHeight);
defineCustomElement('aie-break', Break);
defineCustomElement('aie-quote', Quote);
defineCustomElement('aie-image', Image);
defineCustomElement('aie-video', Video);
defineCustomElement('aie-code-block', CodeBlock);
defineCustomElement('aie-hr', Hr);
defineCustomElement('aie-table', Table);
defineCustomElement('aie-attachment', Attachment);
defineCustomElement('aie-fullscreen', Fullscreen);
defineCustomElement('aie-printer', Printer);
defineCustomElement('aie-emoji', Emoji);
defineCustomElement('aie-ai', Ai);
defineCustomElement('aie-group', Group);

export type MenuButtonOptions = {
    key: string,
    title: string,
    svg: string,
}

const defaultMenus = ["undo", "redo", "brush", "eraser", "divider", "heading", "font-family", "font-size", "divider", "bold", "italic", "underline"
    , "strike", "link", "code", "subscript", "superscript", "hr", "todo", "emoji", "divider", "highlight", "font-color", "divider"
    , "align", "line-height", "divider", "bullet-list", "ordered-list", "indent-decrease", "indent-increase", "break", "divider"
    , "image", "video", "attachment", "quote", "container", "code-block", "table", "divider", "source-code", "printer", "fullscreen", "ai"
];


export class Header extends HTMLElement implements AiEditorEvent {
    // template:string;
    menuButtons: AbstractMenuButton[] = [];

    constructor() {
        super();
    }

    connectedCallback() {
        if (this.children && this.children.length > 0) {
            return
        }
        const divElement = document.createElement("div");
        for (let menuButton of this.menuButtons) {
            divElement.appendChild(menuButton);
        }
        divElement.style.display = "flex"
        divElement.style.flexWrap = "wrap"
        this.appendChild(divElement)
    }

    onCreate(event: EditorEvents["create"], options: AiEditorOptions): void {
        let toolbarKeys = options.toolbarKeys || defaultMenus;
        initToolbarKeys(event, options, this.menuButtons, toolbarKeys);
    }


    onTransaction(event: EditorEvents["transaction"]): void {
        for (let menuButton of this.menuButtons) {
            menuButton.onTransaction(event);
        }
    }


}



