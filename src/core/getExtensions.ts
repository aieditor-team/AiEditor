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
import {CodeBlockExt, languages} from "../extensions/CodeBlockExt.ts";
import {all, createLowlight} from "lowlight";
import {VideoExt} from "../extensions/VideoExt.ts";
import {IFrameExt} from "../extensions/IFrameExt.ts";
import {getBubbleMenus} from "./getBubbleMenus.ts";
import {Placeholder} from "@tiptap/extension-placeholder";
import {createMention} from "../extensions/MentionExt.ts";
import {AiEditor, AiEditorOptions} from "./AiEditor.ts";
import {AiCommandExt, defaultCommands} from "../extensions/AiCommandExt.ts";
import {SelectionMarkerExt} from "../extensions/SelectionMarkerExt.ts";
import {ContainerExt, defaultItems} from "../extensions/ContainerExt.ts";
import {HeadingExt} from "../extensions/HeadingExt.ts";
import {SaveExt} from "../extensions/SaveExt.ts";
import {FigureExt} from "../extensions/FigureExt.ts";
import {FigcaptionExt} from "../extensions/FigcaptionExt.ts";
import {PasteExt} from "../extensions/PasteExt.ts";
import {ClassNameExt} from "../extensions/ClassNameExt.ts";

export const getExtensions = (editor: AiEditor, options: AiEditorOptions): Extensions => {
    // the Collaboration extension comes with its own history handling
    const ret: Extensions = [StarterKit.configure({
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
                uploadFormName: options.attachment?.uploadFormName,
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
                uploadFormName: options.image?.uploadFormName,
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
            CharacterCount.configure({
                textCounter: typeof options?.textCounter === "function"
                    ? options.textCounter : (text) => text.length
            }),
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
                lowlight: createLowlight(all),
                defaultLanguage: 'auto',
                languageClassPrefix: 'language-',
                languages: options.codeBlock?.languages || languages,
                codeExplainAi: options.ai?.codeBlock?.codeExplain || {
                    model: "auto",
                    prompt: options.codeBlock?.codeExplainPrompt || "帮我对这个代码进行解释，返回代码的解释内容，注意，不需要对代码的注释进行解释",
                },
                codeCommentsAi: options.ai?.codeBlock?.codeComments || {
                    model: "auto",
                    prompt: options.codeBlock?.codeCommentsPrompt || "帮我对这个代码添加一些注释，并返回添加注释的代码，只返回代码",
                },
            }),
            VideoExt.configure({
                uploadUrl: options.video?.uploadUrl,
                uploadHeaders: options.video?.uploadHeaders,
                uploadFormName: options.video?.uploadFormName,
                uploader: options.video?.uploader || options.uploader,
                uploaderEvent: options.video?.uploaderEvent,
            }),
            IFrameExt,
            FigureExt,
            FigcaptionExt,
            SaveExt.configure({
                onSave: options.onSave,
            }),
            PasteExt,
            ClassNameExt,
            ContainerExt.configure({
                defaultType: options.container?.defaultTypeName || "warning",
                typeItems: options.container?.typeItems || defaultItems,
            }),
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

    if (options.onMentionQuery) {
        ret.push(createMention(options.onMentionQuery))
    }

    return ret;
}
