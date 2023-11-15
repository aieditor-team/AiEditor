export const resize = (container: HTMLDivElement
    , root: HTMLElement
    , updateAttrs: (data: any) => void) => {

    const imgRef = container.querySelector(".resize-obj") as HTMLElement,
        minWidth = 10;

    let startX: number, imageWidth: number, startPosition: string,maxWidth:number;


    const onMousedown = (e: any) => {
        e.preventDefault();

        root.addEventListener('mousemove', onMousemove);
        root.addEventListener('mouseup', onMouseup);
        root.addEventListener('mouseleave', onMouseup);

        startX = e.clientX;
        imageWidth = Number(imgRef.getAttribute("data-with")) || imgRef.clientWidth;
        startPosition = e.target.getAttribute("data-position");
        maxWidth = (root.clientWidth - 100);
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
    }


    const onMouseup = () => {
        root.removeEventListener('mousemove', onMousemove);
        root.removeEventListener('mouseup', onMouseup);
        root.removeEventListener('mouseleave', onMouseup);

        const attrs = {width: Number(imgRef.getAttribute("data-width"))};
        updateAttrs(attrs)
    };


    for (let child of container.querySelector(".aie-resize")!.children) {
        child.addEventListener("mousedown", onMousedown)
    }


}