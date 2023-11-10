// import { Extension} from '@tiptap/core'
//
// import Suggestion, {SuggestionOptions, SuggestionProps} from '@tiptap/suggestion'
//
//
//
// import tippy, {Instance} from "tippy.js";
// import {XingHuoSocket} from "../ai/xinghuo/XingHuoSocket.ts";
//
// export type AiCommandOptions = {
//     HTMLAttributes?: Record<string, any>
//     suggestion: Omit<SuggestionOptions, 'editor'>
// }
//
// export const AiCommandExt = Extension.create<AiCommandOptions>({
//     name: 'aiCommand',
//
//     addOptions() {
//         return {
//             suggestion: {
//                 char: '/',
//                 command: ({editor, range, props}) => {
//                     props.id.command({editor, range})
//                 },
//                 items: ({query}) => {
//                     return [
//                         {
//                             title: 'AI 续写',
//                             command: ({editor, range}) => {
//
//                                 // const editor  = e as Editor;
//                                 // editor.state.selection.
//
//                                 // const textSelection = TextSelection.create(editor.state.doc,range.to,range.from);
//                                 // const slice = textSelection.content();
//
//                                 const commandText = editor.state.doc.textBetween(range.from,range.to);
//                                 console.log("commandText: ",commandText)
//
//                                 editor
//                                     .chain()
//                                     .focus()
//                                     .deleteRange(range)
//                                     .run()
//
//                                 const textContent = editor.state.selection.$head.parent.textContent;
//                                 const  ct = `"${textContent}" 请帮我继续扩展一些这段话的内容`
//
//                                 const APISecret = "****"
//                                 const APIKey = "***"
//
//                                 const xhSocket = new XingHuoSocket("****",APISecret, APIKey,"v3.1", editor);
//                                 xhSocket.start(ct);
//
//
//                             },
//                         },
//                         {
//                             title: 'AI 优化（改写）',
//                             command: ({editor, range}) => {
//                                 editor
//                                     .chain()
//                                     .focus()
//                                     .deleteRange(range)
//                                     .setNode('heading', {level: 2})
//                                     .run()
//                             },
//                         },
//                         {
//                             title: 'AI 校对（发现错别字）',
//                             command: ({editor, range}) => {
//                                 editor
//                                     .chain()
//                                     .focus()
//                                     .deleteRange(range)
//                                     .setMark('bold')
//                                     .run()
//                             },
//                         },
//                         {
//                             title: 'AI 翻译',
//                             command: ({editor, range}) => {
//                                 editor
//                                     .chain()
//                                     .focus()
//                                     .deleteRange(range)
//                                     .setMark('italic')
//                                     .run()
//                             },
//                         },
//                     ];//.filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
//                 },
//
//
//                 render: () => {
//
//                     let element: HTMLDivElement;
//                     let popup: Instance[];
//                     let selectIndex: number = 0;
//                     let suggestionProps: SuggestionProps;
//                     const updateElement = () => {
//                         element.innerHTML = `
//                             <div class="items">
//                              ${suggestionProps.items.map((item: any, index) => {
//                             return `<button class="item ${index === selectIndex ? 'item-selected' : ''}">${item.title}</button>`
//                         }).join("")}
//                             </div>
//                             `
//                     }
//
//                     return {
//
//                         onStart: (props: SuggestionProps) => {
//
//                             element = document.createElement("div") as HTMLDivElement;
//                             element.classList.add("suggestion")
//                             suggestionProps = props;
//
//                             if (!props.clientRect) {
//                                 return
//                             }
//
//                             updateElement();
//
//                             // @ts-ignore
//                             popup = tippy('body', {
//                                 getReferenceClientRect: props.clientRect,
//                                 appendTo: () => props.editor.view.dom.closest(".aie-container"),
//                                 content: element,
//                                 showOnCreate: true,
//                                 interactive: true,
//                                 allowHTML: true,
//                                 trigger: 'manual',
//                                 placement: 'left-start',
//                             })
//                         },
//
//                         onUpdate(props) {
//                             suggestionProps = props;
//
//                             if (!props.clientRect) {
//                                 return
//                             }
//
//                             popup[0].setProps({
//                                 getReferenceClientRect: props.clientRect as any,
//                             })
//                         },
//
//                         onKeyDown(props) {
//                             if (props.event.key === 'Escape') {
//                                 popup[0].hide();
//                                 return true;
//                             } else if (props.event.key === "ArrowUp") {
//                                 selectIndex = (selectIndex + suggestionProps.items.length - 1) % suggestionProps.items.length
//                                 updateElement();
//                                 return true;
//                             } else if (props.event.key === "ArrowDown") {
//                                 selectIndex = (selectIndex + 1) % suggestionProps.items.length
//                                 updateElement();
//                                 return true;
//                             } else if (props.event.key === "Enter") {
//                                 const item = suggestionProps.items[selectIndex];
//                                 if (item) suggestionProps.command({id: item})
//                                 return true;
//                             }
//                             return false;
//                         },
//
//                         onExit() {
//                             popup[0].destroy()
//                             element.remove()
//                         },
//                     }
//                 }
//             },
//         }
//     },
//
//     addProseMirrorPlugins() {
//         return [
//             Suggestion({
//                 editor: this.editor,
//                 ...this.options.suggestion,
//             }),
//         ]
//     },
// })