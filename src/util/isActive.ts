import {findParentNode, isNodeActive} from '@tiptap/core';
import type {EditorState} from '@tiptap/pm/state';
import {isMarkActive} from './isMarkActive';
import {NodeType} from "@tiptap/pm/model";

function isListType(type: NodeType): boolean {
    return !!type.spec.group?.split(' ').includes('list');
}

export function isActive(
    state: EditorState,
    name: string | null,
    attributes: Record<string, any> = {}
): boolean {
    if (!name) {
        return (
            isNodeActive(state, null, attributes) ||
            isMarkActive(state, null, attributes)
        );
    }
    const type = state.schema.nodes[name];
    if (type) {
        const listTypeFlag = isListType(type);
        if (listTypeFlag) {
            const parentList = findParentNode((node) => isListType(node.type))(
                state.selection
            );
            return !!(parentList && parentList.node.type.name === name);
        }
        return isNodeActive(state, name, attributes);
    }

    if (state.schema.marks[name]) {
        return isMarkActive(state, name, attributes);
    }

    return false;
}
