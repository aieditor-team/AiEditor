import { TableHeader } from '@tiptap/extension-table-header';

export const TableHeaderExt = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // 继承默认属性
      backgroundColor: {
        default: null, // 默认没有背景色
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
    };
  },
});