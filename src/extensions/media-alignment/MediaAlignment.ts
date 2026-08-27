export type MediaAlignment = 'left' | 'center' | 'right'

/** 块级媒体共享的可序列化对齐属性。 */
export const mediaAlignmentAttribute = {
    default: 'center' as MediaAlignment,
    parseHTML: (element: HTMLElement): MediaAlignment => {
        const alignment = element.getAttribute('data-alignment')
        return alignment === 'left' || alignment === 'right' ? alignment : 'center'
    },
    renderHTML: ({alignment}: { alignment: MediaAlignment }) => ({'data-alignment': alignment}),
}
