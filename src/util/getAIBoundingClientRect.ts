import {Editor, posToDOMRect} from "@tiptap/core";

export const getAIBoundingClientRect = (editor: Editor) => {
    const {view, state} = editor;
    const {head, from, to} = state.selection;
    if (from == 1 && to == state.doc.content.size - 1) {
        const selectRect = posToDOMRect(view, from, to);

        const container = view.dom.closest('.aie-container')!;
        const editorRect = container.getBoundingClientRect();

        const bottom = selectRect.bottom > editorRect.bottom ? editorRect.bottom : selectRect.bottom;
        let height = selectRect.height > editorRect.height ? editorRect.height / 2 : selectRect.height;
        const top = selectRect.top < editorRect.top ? editorRect.top : selectRect.top;

        let left = selectRect.left;

        //最后一行为空白内容
        if (selectRect.width == 0) {
            const domRect = view.dom.getBoundingClientRect();
            left = domRect.left + domRect.right / 2;
            height -= 50;
        }

        return {
            ...selectRect,
            top,
            left,
            height,
            bottom,
        };
    } else {
        const headRect = posToDOMRect(view, head, head);
        return {
            ...headRect,
            height: headRect.height - 10
        }
    }
}
