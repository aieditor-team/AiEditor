import {Extensions} from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {Underline} from "@tiptap/extension-underline";
import {TextStyle} from "@tiptap/extension-text-style";
import {FontFamily} from "@tiptap/extension-font-family";
import {AttachmentExt} from "../extensions/AttachmentExt.ts";
import {PainterExt} from "../extensions/PainterExt.ts";
import {Highlight} from "@tiptap/extension-highlight";
import {Color} from "@tiptap/extension-color";
import {FontSizeExt} from "../extensions/FontSizeExt.ts";
import {LineHeightExt} from "../extensions/LineHeightExt.ts";
import {TextAlign} from "@tiptap/extension-text-align";
import {IndentExt} from "../extensions/IndentExt.ts";
import {ImageExt} from "../extensions/ImageExt.ts";
import {Table} from "@tiptap/extension-table";
import {TableRow} from "@tiptap/extension-table-row";
import {TableHeader} from "@tiptap/extension-table-header";
import {TableCell} from "@tiptap/extension-table-cell";
import {CharacterCount} from "@tiptap/extension-character-count";
import {Link} from "@tiptap/extension-link";
import {Superscript} from "@tiptap/extension-superscript";
import {Subscript} from "@tiptap/extension-subscript";
import {TaskList} from "@tiptap/extension-task-list";
import {TaskItem} from "@tiptap/extension-task-item";
import {CodeBlockExt} from "../extensions/CodeBlockExt.ts";
import {common, createLowlight} from "lowlight";
import {VideoExt} from "../extensions/VideoExt.ts";
import {IFrameExt} from "../extensions/IFrameExt.ts";
import {getBubbleMenus} from "./getBubbleMenus.ts";
import {Placeholder} from "@tiptap/extension-placeholder";
import {createMention} from "../extensions/MentionExt.ts";
import {AiEditor, AiEditorOptions} from "./AiEditor.ts";
import {AiCommandExt, defaultCommands} from "../extensions/AiCommandExt.ts";
import {SelectionMarkerExt} from "../extensions/SelectionMarkerExt.ts";
import {Markdown} from "tiptap-markdown";
import {ContainerExt} from "../extensions/ContainerExt.ts";
import {HeadingExt} from "../extensions/HeadingExt.ts";
import {SaveExt} from "../extensions/SaveExt.ts";

export const getExtensions = (editor: AiEditor, options: AiEditorOptions): Extensions => {
    // the Collaboration extension comes with its own history handling
    const ret: Extensions = options.cbName && options.cbUrl ? [StarterKit.configure({
        history: false,
        codeBlock: false,
        heading: false,
    })] : [StarterKit.configure({
        codeBlock: false,
        heading: false,
    })];

    {
        //push default extensions
        ret.push(Underline, TextStyle, FontFamily,
            HeadingExt,
            AttachmentExt.configure({
                uploadUrl: options.attachment?.uploadUrl,
                uploadHeaders: options.attachment?.uploadHeaders,
                uploadFormName:options.attachment?.uploadFormName,
                uploader: options.attachment?.uploader || options.uploader,
                uploaderEvent: options.attachment?.uploaderEvent,
            }),
            PainterExt,
            SelectionMarkerExt,
            Highlight.configure({
                multicolor: true
            }),
            Color, FontSizeExt, LineHeightExt,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            IndentExt,
            ImageExt.configure({
                allowBase64: typeof options.image?.allowBase64 === "undefined" ? true : options.image?.allowBase64,
                defaultSize: options.image?.defaultSize || 350,
                uploadUrl: options.image?.uploadUrl,
                uploadHeaders: options.image?.uploadHeaders,
                uploadFormName:options.image?.uploadFormName,
                uploader: options.image?.uploader || options.uploader,
                uploaderEvent: options.image?.uploaderEvent,
            }),
            Table.configure({
                resizable: true,
                lastColumnResizable: true,
                allowTableNodeSelection: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            CharacterCount,
            Link.configure({
                openOnClick: false,
                autolink: typeof options.link?.autolink === "undefined" ? true : options.link?.autolink,
                HTMLAttributes: {
                    ref: options?.link?.rel,
                    class: options?.link?.class,
                }
            }),
            Superscript,
            Subscript,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),

            CodeBlockExt.configure({
                lowlight: createLowlight(common),
                defaultLanguage: 'auto',
                languageClassPrefix: 'language-',
                codeExplainAi: options.ai?.codeBlock?.codeExplain || {
                    model: "auto",
                    prompt: "帮我对这个代码进行解释，返回代码的解释内容，注意，不需要对代码的注释进行解释",
                },
                codeCommentsAi: options.ai?.codeBlock?.codeComments || {
                    model: "auto",
                    prompt: "帮我对这个代码添加一些注释，并返回添加注释的代码，只返回代码",
                },
            }),
            VideoExt.configure({
                uploadUrl: options.video?.uploadUrl,
                uploadHeaders: options.video?.uploadHeaders,
                uploadFormName:options.video?.uploadFormName,
                uploader: options.video?.uploader || options.uploader,
                uploaderEvent: options.video?.uploaderEvent,
            }),
            IFrameExt,
            SaveExt.configure({
                onSave: options.onSave,
            }),
            // PasteExt,
            Markdown.configure({
                html: true,                  // Allow HTML input/output
                tightLists: true,            // No <p> inside <li> in markdown output
                tightListClass: 'tight',     // Add class to <ul> allowing you to remove <p> margins when tight
                bulletListMarker: '-',       // <li> prefix in markdown output
                linkify: true,              // Create links from "https://..." text
                breaks: true,               // New lines (\n) in markdown input are converted to <br>
                transformPastedText: true,  // Allow to paste markdown text in the editor
                transformCopiedText: false,  // Copied text is transformed to markdown
            }),
            ContainerExt,
            ...getBubbleMenus(editor),
        )
    }

    if (options.placeholder) {
        ret.push(Placeholder.configure({
            placeholder: options.placeholder,
        }))
    }

    // if (options.ai?.command){
    ret.push(AiCommandExt.configure({
        suggestion: {
            items: (_) => {
                const commands = options.ai?.commands || defaultCommands;
                return commands as any;
            }
        }
    }))
    // }

    // if (options.cbName && options.cbUrl) {
    //     const provider = new HocuspocusProvider({
    //         url: options.cbUrl,
    //         name: options.cbName,
    //     })
    //     ret.push(Collaboration.configure({
    //         document: provider.document,
    //     }))
    // }

    if (options.onMentionQuery) {
        ret.push(createMention(options.onMentionQuery))
    }

    return ret;
}