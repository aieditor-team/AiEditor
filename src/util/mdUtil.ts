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

turndownService.keep((node: any) => {
    return !(node && node.nodeName === "DIV");
});


export const mdToHtml = (markdown: string) => {
    if (!markdown) return markdown;
    const renderHtml = md.render(markdown).trim();
    if (!renderHtml) return markdown;
    const parser = new DOMParser();
    const doc = parser.parseFromString(renderHtml, 'text/html');
    let html = '';
    for (let i = 0; i < doc.body.children.length; i++) {
        const element = doc.body.children[i];
        if (i == 0 && element.tagName === "P") {
            html += element.innerHTML;
        } else {
            // https://gitee.com/aieditor-team/aieditor/pulls/10
            html += element.querySelector("img")
                ? element.innerHTML : element.outerHTML;
        }
    }
    return html;
}


export const htmlToMd = (html: string) => {
    if (!html) return html;
    return turndownService.turndown(html)
}
