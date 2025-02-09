import { Extension } from "@tiptap/core";

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tocGenerator: {
      generateToc: () => ReturnType,
    }
  }
}

export interface ITocItem {
  text: string;
  level: number;
  id: string;
  pos: number;
}

const SUB_MENU_INDENT = 16; // 子菜单缩进单位 16px

/**
 * 生成目录条目列表
 */
export function createTocList(arr: ITocItem[]) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return "";
  }

  const first = arr[0];
  const topLevel = first.level;

  return arr
    .map((item) => {
      const { text, level, id, pos } = item;
      const levelDiffFromTop = level - topLevel;
      const isTopLevel = levelDiffFromTop === 0;
      const indent = levelDiffFromTop * SUB_MENU_INDENT;

      return `
<div class="aie-toc-item" data-toc-id="${id}" data-pos="${pos}">
  <span class="aie-toc-item__title ${
    isTopLevel ? "toplevel" : ""
  }" style="margin-left:${indent}px;">
    <span class="aie-toc-item__symbol" style="display: ${
      isTopLevel ? "none" : 'inline-block'
    }"></span>
    <span class="aie-toc-item__text">${text}</span>
  </span>
  <span class="aie-toc-item__dots"></span>
</div>
    `.trim();
    })
    .join("");
}

/**
 * 点击目录条目时滚动到对应位置
 */
export const handleTocClick = (e: Event) => {
  const tocRow = (e?.target as HTMLElement).closest(".aie-toc-item") as HTMLElement;
  if (tocRow) {
    const id = tocRow.dataset.tocId as string;
    const heading = document.getElementById(id);
    if (heading) {
      heading.scrollIntoView({ behavior: "smooth", block: 'start' });
    }
  }
};

export const TocGeneratorExt = Extension.create({
  name: "tocGenerator",
  addStorage() {
    return {
      tocItems: [] as ITocItem[],
    };
  },
  addOptions() {
    return {
      includeLevels: [1, 2, 3],
    };
  },
  addCommands() {
    return {
      generateToc: () => ({ state: { doc } }) => {
        const tocItems = [] as ITocItem[];

        doc.descendants((node, pos) => {
          if (node.type.name === "heading") {
            const level = node.attrs.level;
            if (this.options.includeLevels.includes(level)) {
              const text = node.textContent;
              const id = node.attrs.id;
              tocItems.push({ text, level, id, pos });
            }
          }
        });

        this.storage.tocItems = tocItems;
        return true;
      },
    };
  },
});
