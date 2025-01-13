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


export const clearDataMpSlice = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const fragment = document.createDocumentFragment();
    const children = doc.body.children;
    for (let child of children) {
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
    if (ulList) {
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
                        ul.removeAttribute(attr)
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
    if (liNodeList) liNodeList.forEach(li => {
        if (!li.innerHTML) li.innerHTML = "<p></p>"
    })

    const imgNodeList = doc.querySelectorAll('body>p>img');
    if (imgNodeList.length > 0) {
        const body = doc.querySelector('body')!;
        for (const image of imgNodeList) {
            const imageParent = image.parentNode;
            const position = Array.prototype.indexOf.call(body.children, imageParent);
            body.insertBefore(image, body.children[position]);
        }
    }

    let html = '';
    doc.body.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            html += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element === doc.body.firstChild && element.tagName === "P") {
                html += element.innerHTML;
            } else {
                // https://gitee.com/aieditor-team/aieditor/pulls/10
                if (element.querySelector("img") && element.tagName !== "A") {
                    //return image element
                    html += element.innerHTML;
                } else {
                    html += element.outerHTML;
                }
            }
        }
    })
    return html;
}
