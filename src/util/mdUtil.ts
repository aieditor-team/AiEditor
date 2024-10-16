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
    return md.render(markdown);
}

export const htmlToMd = (html: string) => {
    return turndownService.turndown(html)
}
