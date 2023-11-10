import { getMarkType, objectIncludes } from '@tiptap/core';
import type { MarkRange } from '@tiptap/core';
import type { MarkType } from '@tiptap/pm/model';
import type { EditorState } from '@tiptap/pm/state';

export function isMarkActive(
    state: EditorState,
    typeOrName: MarkType | string | null,
    attributes: Record<string, any> = {}
): boolean {
    const { empty, ranges, from, to } = state.selection;
    const type = typeOrName ? getMarkType(typeOrName, state.schema) : null;

    if (empty) {
        return !!(state.storedMarks || state.selection.$from.marks())
            .filter((mark) => {
                if (!type) {
                    return true;
                }
                return type.name === mark.type.name;
            })
            .find((mark) =>
                objectIncludes(mark.attrs, attributes, { strict: false })
            );
    }

    let selectionFrom = from;
    let selectionTo = to;
    const markRanges: MarkRange[] = [];

    ranges.forEach(({ $from, $to }) => {
        const from = $from.pos;
        const to = $to.pos;

        selectionFrom = Math.min(selectionFrom, from);
        selectionTo = Math.max(selectionFrom, to);

        state.doc.nodesBetween(from, to, (node, pos) => {
            if (!node.isText && !node.marks.length) {
                return;
            }

            const relativeFrom = Math.max(from, pos);
            const relativeTo = Math.min(to, pos + node.nodeSize);

            markRanges.push(
                ...node.marks.map((mark) => ({
                    mark,
                    from: relativeFrom,
                    to: relativeTo,
                }))
            );
        });
    });

    const selectionRange = selectionTo - selectionFrom;

    if (selectionRange === 0) {
        return false;
    }

    // calculate range of matched mark
    const matchedRange = markRanges
        .filter((markRange) => {
            if (!type) {
                return true;
            }

            return type.name === markRange.mark.type.name;
        })
        .filter((markRange) =>
            objectIncludes(markRange.mark.attrs, attributes, { strict: false })
        )
        .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);

    // calculate range of marks that excludes the searched mark
    // for example `code` doesn’t allow any other marks
    const excludedRange = markRanges
        .filter((markRange) => {
            if (!type) {
                return true;
            }

            return markRange.mark.type !== type && markRange.mark.type.excludes(type);
        })
        .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);

    // we only include the result of `excludedRange`
    // if there is a match at all
    const range = matchedRange > 0 ? matchedRange + excludedRange : matchedRange;

    return range >= selectionRange;
}