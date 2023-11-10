// import tippy from 'tippy.js'
// import {SuggestionProps} from "@tiptap/suggestion/dist/packages/suggestion/src/suggestion";
//
//
// export default {
//     items: ({ query }) => {
//         console.log("query: ",query)
//         return [
//             'Lea Thompson',
//             'Cyndi Lauper',
//             'Tom Cruise',
//             'Madonna',
//             'Jerry Hall',
//             'Joan Collins',
//         ].filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
//             .slice(0, 5)
//     },
//
//     render: () => {
//         let component,popup;
//
//         return {
//             onStart: (props:SuggestionProps) => {
//                 // component = new ReactRenderer(MentionList, {
//                 //     props,
//                 //     editor: props.editor,
//                 // })
//
//                 component = document.createElement("div") as HTMLDivElement;
//                 component.style.width = "200px"
//                 component.style.height = "200px"
//                 component.style.bottom = "solid 1px #ccc"
//                 component.style.background = "antiquewhite"
//                 component.innerHTML = `
//                 <div className="items">
//                  ${props.items.forEach((item:any) => {
//                      `<button>${item}</button>`
//                 }).join("")}
//                 </div>
//                 `
//
//                 // Document.
//                 console.log("onStart: ",props)
//                 if (!props.clientRect) {
//                     return
//                 }
//
//                 popup = tippy('body', {
//                     getReferenceClientRect: props.clientRect,
//                     appendTo: () => document.body,
//                     content: `<div style="width: 200px;height: 200px;border: solid 1px #ccc;background: antiquewhite"></div>`,
//                     showOnCreate: true,
//                     interactive: true,
//                     allowHTML:true,
//                     trigger: 'manual',
//                     placement: 'bottom-start',
//                 })
//             },
//
//             onUpdate(props) {
//                 console.log("onUpdate: ",props)
//                 // component.updateProps(props)
//                 //
//                 // if (!props.clientRect) {
//                 //     return
//                 // }
//                 //
//                 // popup[0].setProps({
//                 //     getReferenceClientRect: props.clientRect,
//                 // })
//             },
//
//             onKeyDown(props) {
//                 console.log("onKeyDown: ",props)
//                 return true;
//                 // if (props.event.key === 'Escape') {
//                 //     popup[0].hide()
//                 //
//                 //     return true
//                 // }
//                 //
//                 // return component.ref?.onKeyDown(props)
//             },
//
//             onExit() {
//                 console.log("onExit: ")
//                 popup[0].destroy()
//                 // component.destroy()
//             },
//         }
//     },
// }