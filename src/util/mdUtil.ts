// @ts-ignore
import markdownit from 'markdown-it'
// @ts-ignore
import TurndownService from 'turndown'

const md = markdownit({
    html: true,
    linkify: true,
    typographer: true
})


//options https://github.com/mixmark-io/turndown?tab=readme-ov-file#options
const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
    preformattedCode: false,
});


export const mdToHtml = (markdown: string) => {
    if (!markdown) return markdown;
    const renderHtml = md.render(markdown).trim();
    if (!renderHtml) return markdown;
    const parser = new DOMParser();
    const doc = parser.parseFromString(renderHtml, 'text/html');
    let html = '';
    for (let i = 0; i < doc.body.children.length; i++) {
        const child = doc.body.children[i];
        if (child.children.length != 0) {
            child.childNodes.forEach(node => {
                if (node.nodeType === 1) {
                    const elementNode = node as Element;
                    html += elementNode.outerHTML;
                } else if (node.nodeType === 3) {
                    html += node.textContent;
                }
            });
        } else if (i == 0 && child.tagName === "P") {
            html += child.innerHTML;
        } else {
            html += child.outerHTML;
        }
    }
    return html;
}


export const htmlToMd = (html: string) => {
    if (!html) return html;
    return turndownService.turndown(html)
}
