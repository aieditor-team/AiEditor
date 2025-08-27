export const createElement = (html: string) => {
    const htmlDivElement = document.createElement("div");
    htmlDivElement.innerHTML = html;
    return htmlDivElement.firstElementChild!;
}

export const removeHtmlTag = (html: string, tagName: string): string => {
    const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, 'gi');
    return html.replace(regex, (_, innerContent) => innerContent);
}

export const removeHtmlTags = (html: string, tagNames: string[]): string => {
    for (let tagName of tagNames) {
        html = removeHtmlTag(html, tagName);
    }
    return html
}

export const cleanHtml = (html: string, preserveTags: string[], removeAttrs: boolean): string => {

    function clearChildren(element: HTMLElement) {
        const fragment = document.createDocumentFragment();
        while (element.firstChild) {
            const childNode = element.removeChild(element.firstChild);
            const cleanedChild = cleanNode(childNode);
            if (cleanedChild) {
                fragment.appendChild(cleanedChild);
            }
        }
        return fragment;
    }

    function cleanNode(node: Node): Node | null {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (preserveTags.includes(element.tagName.toLowerCase())) {
                const textContent = element.textContent?.trim() || "";
                if (!textContent) {
                    return element;
                }
                if (removeAttrs) {
                    while (element.attributes.length > 0) {
                        element.removeAttribute(element.attributes[0].name);
                    }
                }
                element.appendChild(clearChildren(element));
                return element;
            } else {
                return clearChildren(element);
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent && node.textContent.trim().length > 0) {
                return node
            }
        }
        return null;
    }

    function replaceDoubleBrWithP(container: HTMLElement) {
        const brElements = container.querySelectorAll('br');
        for (let i = 0; i < brElements.length - 1; i++) {
            const currentBr = brElements[i];
            const nextBr = brElements[i + 1];
            if (currentBr.nextSibling === nextBr) {
                let previousSibling = currentBr.previousSibling;
                const elementsToWrap: Node[] = [];
                while (previousSibling && previousSibling.nodeName !== "P") {
                    elementsToWrap.unshift(previousSibling);
                    previousSibling = previousSibling.previousSibling;
                }

                const pElement = document.createElement('p');
                elementsToWrap.forEach(el => pElement.appendChild(el));
                currentBr.replaceWith(pElement);
                nextBr.remove();

                i++
            }
        }
    }

    html = html.replace(/(\n)/gm, " ");

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const cleanedContent = cleanNode(doc.body);
    const tempDiv = document.createElement('div');
    if (cleanedContent) {
        tempDiv.appendChild(cleanedContent);
        replaceDoubleBrWithP(tempDiv);
    }
    return tempDiv.innerHTML;
}


export const isExcelDocument = (document: Document) => {
    const attributeNames = document.documentElement.getAttributeNames();
    if (attributeNames && attributeNames.length > 0) {
        for (let attributeName of attributeNames) {
            const attribute = document.documentElement.getAttribute(attributeName);
            if (attribute?.includes("microsoft") || attribute?.includes("excel")) {
                return true;
            }
        }
    }

    let metaTags = document.getElementsByTagName('meta');
    for (let metaTag of metaTags) {
        let nameAttr = metaTag.getAttribute('name');
        let contentAttr = metaTag.getAttribute('content');
        if (nameAttr && nameAttr.toLowerCase() === 'generator' && (
            contentAttr?.includes("Microsoft")
            || contentAttr?.includes('LibreOffice')
            || contentAttr?.includes('OpenOffice'))) {
            return true;
        }
    }

    const innerHTML = document.body.innerHTML?.trim();
    return !!(innerHTML?.startsWith("<table") && innerHTML?.endsWith("</table>"));
}


export const removeEmptyParagraphs = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(paragraph => {
        if (!paragraph.textContent || paragraph.textContent.trim() === '') {
            //In the case of `<p><img src="src"/></p>`, the text content is empty but should not be cleared
            if (!paragraph.querySelector("img")) {
                paragraph.remove();
            }
        }
    });
    return tempDiv.innerHTML;
}

const isSpecialBlockElement = (element: Element): boolean => {
    const specialElements = [
        'table', 'thead', 'tbody', 'tr', 'th', 'td', // 表格相关
        'ul', 'ol', 'li',                            // 列表相关
        'pre', 'blockquote',                         // 代码块和引用
        'figure', 'iframe', 'video', 'audio',        // 媒体元素
        'svg', 'math', 'embed'                       // 图表、公式和嵌入内容
    ];
    return specialElements.includes(element.tagName.toLowerCase());
};

export const clearDataPmSlice = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const fragment = document.createDocumentFragment();
    const children = doc.body.children;
    for (let child of children) {
        if (isSpecialBlockElement(child)) {
            fragment.appendChild(child.cloneNode(true));
            continue;
        }

        if (child.hasAttribute("data-pm-slice")) {
            child.childNodes.forEach((child) => {
                fragment.appendChild(child.cloneNode(true));
            })
        } else {
            fragment.appendChild(child.cloneNode(true));
        }
    }
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment)
    return tempDiv.innerHTML;
}

export const organizeHTMLContent = (originalHtml: string) => {
    if (!originalHtml) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHtml, 'text/html');
    //change github style task list items to taskList
    const ulList = doc.querySelectorAll("ul");
    if (ulList && ulList.length > 0) {
        ulList.forEach(ul => {
            if (ul.getAttribute("class")?.includes("task-list")) {
                ul.getAttributeNames().forEach(attr => {
                    ul.removeAttribute(attr)
                })
                ul.setAttribute("data-type", "taskList")

                const liOrP = ul.firstElementChild;
                if (liOrP?.tagName === "P") {
                    const fragment = document.createDocumentFragment();
                    liOrP.childNodes.forEach(node => {
                        fragment.append(node.cloneNode(true))
                    })
                    liOrP.replaceWith(fragment)
                }

                const liList = ul.querySelectorAll("li");
                liList.forEach(li => {
                    li.getAttributeNames().forEach(attr => {
                        li.removeAttribute(attr)
                    })
                    const checkbox = li.querySelector("input[type='checkbox']");
                    if (checkbox) {
                        li.setAttribute("data-type", "taskItem")
                        li.setAttribute("data-checked", checkbox.hasAttribute("checked") ? "true" : "false")
                        // li.removeChild(checkbox)
                    }
                })
            }
        })
    }


    //"tiptap" does not support empty list items. Here to fill in the gaps
    const liNodeList = doc.querySelectorAll("li");
    if (liNodeList && liNodeList.length > 0) {
        liNodeList.forEach(li => {
            if (!li.innerHTML) li.innerHTML = "<p></p>"
        })
    }

    const tables = doc.querySelectorAll('table');
    if (tables.length > 0) {
        tables.forEach(table => {
            removeWhitespaceFromTable(table);
        });
    }

    let html = '';
    doc.body.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            html += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            // if (element === doc.body.firstChild && element.tagName === "P") {
            //     html += element.innerHTML;
            // } else {
            // https://gitee.com/aieditor-team/aieditor/pulls/10
            if (element.querySelector("img") && element.tagName !== "A" && element.tagName !== "TABLE") {
                //return image element
                html += element.innerHTML;
            } else {
                html += element.outerHTML;
            }
            // }
        }
    })

    return transformMixedParagraphs(html);
}


/**
 * 由于在 tiptap 中， p 段落只能有文本，所以如果有图片，则需要将图片转换为 img 元素
 * <p>第一段文字<img src="1.jpg">第二段文字<img src="2.jpg">第三段文字<img src="3.jpg">最后一段文字</p>
 * 转换为
 * <p>第一段文字</p>
 * <img src="1.jpg">
 * <p>第二段文字</p>
 * <img src="2.jpg">
 * <p>第三段文字</p>
 * <img src="3.jpg">
 * <p>最后一段文字</p>
 * @param html
 */
export const transformMixedParagraphs = (html: string): string => {
    if (!html) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    //  找到文档中所有的 <p> 元素
    const allParagraphs = doc.querySelectorAll('p');

    allParagraphs.forEach(p => {
        const nodes = Array.from(p.childNodes);
        const parent = p.parentNode;
        if (!parent) return;

        // 如果这个 <p> 不包含 <img>，可以跳过（可选优化）
        const hasImg = nodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName === 'IMG'
        );
        if (!hasImg) return;

        const fragment = document.createDocumentFragment();
        let currentP: HTMLElement | null = doc.createElement('p'); // 用于累积文本

        nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textContent = node.textContent;
                if (textContent && textContent.trim()) {
                    currentP?.appendChild(node.cloneNode());
                } else if (textContent?.length) {
                    // 可选：保留空白字符作为单个空格
                    if (!currentP?.lastChild) {
                        currentP?.appendChild(doc.createTextNode(' '));
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'IMG') {
                // 遇到图片：先输出当前累积的 <p>
                if (currentP && currentP.childNodes.length > 0) {
                    fragment.appendChild(currentP);
                }
                // 重置为新 <p>
                currentP = doc.createElement('p');
                // 添加图片
                fragment.appendChild(node.cloneNode(true));
            }
        });
        // 处理最后剩下的文本
        if (currentP && currentP.childNodes.length > 0) {
            fragment.appendChild(currentP);
        }

        // 用 fragment 替换原来的 <p>
        parent.replaceChild(fragment, p);
    });

    // 返回 body 内容
    return doc.body.innerHTML;
};


export const cleanFirstParagraph = (html: string): string => {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html.trim(), 'text/html');

    let result = '';
    doc.body.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element === doc.body.firstChild && element.tagName === "P") {
                result += element.innerHTML;
            } else {
                result += element.outerHTML;
            }
        }
    })
    return result;
}

export const cleanTableWhitespace = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
        removeWhitespaceFromTable(table);
    });

    return doc.body.innerHTML;
}

export const removeWhitespaceFromTable = (node: Node): void => {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        // 判断是否是 table 的结构元素（包括 colgroup 和 col）
        const isTableStructureTag = [
            'TABLE',
            'THEAD',
            'TBODY',
            'TFOOT',
            'TR',
            'COLGROUP',
            'COL'
        ].includes(el.tagName);

        if (isTableStructureTag) {
            const children = Array.from(el.childNodes);
            children.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    // 移除纯空白文本节点
                    if (/^[\s\n\r]*$/.test(child.textContent || '')) {
                        el.removeChild(child);
                    }
                } else {
                    removeWhitespaceFromTable(child); // 递归处理子节点
                }
            });
        }

        // 处理 td/th：如果为空，则插入 <p></p>
        // 解决 table 中插入空白单元格时会出现错误： Uncaught RangeError: Invalid content for node tableCell: <> 的问题
        if (el.tagName === 'TD' || el.tagName === 'TH') {
            if (!el.hasChildNodes()) {
                const p = document.createElement('p');
                el.appendChild(p);
            }
        }
    }
}
