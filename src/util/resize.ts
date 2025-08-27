import {Editor} from "@tiptap/core";

export const resize = (editor: Editor
    , currentNode: any
    , container: HTMLDivElement
    , updateAttrs: (data: any) => void
) => {

    const root: HTMLElement = editor.view.dom;
    const imgRef = container.querySelector(".resize-obj") as HTMLElement,
        minWidth = 10;

    let startX: number, imageWidth: number, startPosition: string, maxWidth: number;

    let prevSelection: { from: number; to: number; } | null = null


    const onMousedown = (e: any) => {
        e.preventDefault();

        root.addEventListener('mousemove', onMousemove);
        root.addEventListener('mouseup', onMouseup);
        root.addEventListener('mouseleave', onMouseup);

        startX = e.clientX;
        imageWidth = Number(imgRef.getAttribute("data-with")) || imgRef.clientWidth;
        startPosition = e.target.getAttribute("data-position");
        maxWidth = (root.clientWidth - 100);

        prevSelection = editor.state.selection;
        editor.state.doc.descendants((n, pos) => {
            if (currentNode === n) {
                editor.commands.setNodeSelection(pos);
            }
        })
    };


    const onMousemove = (event: MouseEvent) => {

        const distanceX = event.clientX - startX;
        if (distanceX == 0) return;

        const zoomIn = startPosition === "right" ? distanceX > 0 : distanceX < 0;

        let newWidth = imageWidth + Math.abs(distanceX) * (zoomIn ? 1 : -1);

        if (newWidth >= maxWidth) {
            newWidth = maxWidth;
        }
        if (newWidth < minWidth) {
            newWidth = minWidth;
        }

        //及时修改 image 节点宽度，再拖动结束后再通知渲染视图
        imgRef.style.width = `${newWidth}px`;
        imgRef.setAttribute("data-width", newWidth.toString())

        imgRef.parentElement!.removeAttribute("style")
    }


    const onMouseup = () => {
        root.removeEventListener('mousemove', onMousemove);
        root.removeEventListener('mouseup', onMouseup);
        root.removeEventListener('mouseleave', onMouseup);

        const attrs = {width: Number(imgRef.getAttribute("data-width"))};
        updateAttrs(attrs)

        if (prevSelection) {
            editor.commands.setTextSelection(prevSelection);
        }
    };


    for (let child of container.querySelector(".aie-resize")!.children) {
        child.addEventListener("mousedown", onMousedown)
    }


}
