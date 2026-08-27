import {Editor} from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import {afterEach, describe, expect, it} from 'vitest'
import {Image} from '../../../src/extensions/image/Image'
import {InlineImage} from '../../../src/extensions/inline-image/InlineImage'
import {normalizeImageLink} from '../../../src/extensions/image/ImageLinkAttributes'

const editors: Editor[] = []

function createEditor(content = '<p></p>'): Editor {
  const element = document.createElement('div')
  document.body.append(element)
  const editor = new Editor({
    element,
    extensions: [
      Document,
      Paragraph,
      Text,
      Image.configure({HTMLAttributes: {'data-image-type': 'block'}}),
      InlineImage.configure({HTMLAttributes: {'data-image-type': 'inline'}}),
    ],
    content,
  })
  editors.push(editor)
  return editor
}

afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('Image attributes and links', () => {
  it('通过完整属性命令插入图片并输出安全链接', () => {
    const editor = createEditor()

    expect(editor.commands.setImageWithAttributes({
      src: '/cover.png',
      alt: '封面替代文本',
      title: '封面标题',
      width: '75%',
      height: 320,
      alignment: 'right',
      href: 'https://example.com/document',
      target: '_blank',
      loading: 'lazy',
      decoding: 'async',
    })).toBe(true)

    const html = editor.getHTML()
    const host = document.createElement('div')
    host.innerHTML = html
    const link = host.querySelector('a')
    const image = host.querySelector('img')
    expect(link?.getAttribute('href')).toBe('https://example.com/document')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(image).toMatchObject({alt: '封面替代文本', title: '封面标题'})
    expect(image?.getAttribute('width')).toBe('75%')
    expect(image?.getAttribute('height')).toBe('320')
    expect(image?.getAttribute('data-alignment')).toBe('right')
    expect(image?.getAttribute('loading')).toBe('lazy')
    expect(image?.getAttribute('decoding')).toBe('async')
  })

  it('从链接包裹的 HTML 恢复图片属性', () => {
    const editor = createEditor(`
      <a href="/article#part-2" target="_blank">
        <img src="/photo.png" alt="照片" title="说明" width="640" height="480"
          loading="eager" decoding="sync" data-alignment="left">
      </a>
    `)
    editor.commands.setNodeSelection(0)

    expect(editor.getAttributes('image')).toMatchObject({
      src: '/photo.png',
      alt: '照片',
      title: '说明',
      width: 640,
      height: 480,
      alignment: 'left',
      href: '/article#part-2',
      target: '_blank',
      loading: 'eager',
      decoding: 'sync',
    })
  })

  it('拒绝危险协议，同时保留相对地址、锚点、邮件和电话链接', () => {
    expect(normalizeImageLink(' javascript:alert(1) ')).toBeNull()
    expect(normalizeImageLink('data:text/html,bad')).toBeNull()
    expect(normalizeImageLink('/docs/1')).toBe('/docs/1')
    expect(normalizeImageLink('#heading')).toBe('#heading')
    expect(normalizeImageLink('mailto:team@example.com')).toBe('mailto:team@example.com')
    expect(normalizeImageLink('tel:+8613800000000')).toBe('tel:+8613800000000')

    const editor = createEditor('<img src="/photo.png">')
    editor.commands.setNodeSelection(0)
    expect(editor.commands.setImageLink({href: 'javascript:alert(1)', target: '_blank'})).toBe(true)
    expect(editor.getAttributes('image')).toMatchObject({href: null, target: null})
    expect(editor.getHTML()).not.toContain('<a')
  })

  it('设置、更新和移除图片链接时不影响其他图片属性', () => {
    const editor = createEditor('<img src="/photo.png" alt="照片" title="说明">')
    editor.commands.setNodeSelection(0)

    expect(editor.commands.setImageLink({href: '/detail', target: '_blank'})).toBe(true)
    expect(editor.getAttributes('image')).toMatchObject({
      src: '/photo.png', alt: '照片', title: '说明', href: '/detail', target: '_blank',
    })
    expect(editor.commands.updateImageAttributes({loading: 'lazy', decoding: 'auto'})).toBe(true)
    expect(editor.getAttributes('image')).toMatchObject({loading: 'lazy', decoding: 'auto'})
    expect(editor.commands.unsetImageLink()).toBe(true)
    expect(editor.getAttributes('image')).toMatchObject({href: null, target: null, loading: 'lazy'})
  })

  it('NodeView 会同步新增属性并删除已经清空的原生属性', () => {
    const editor = createEditor('<img src="/photo.png" title="说明" width="600" height="400" loading="lazy" decoding="async">')
    editor.commands.setNodeSelection(0)
    const image = editor.view.dom.querySelector('img')!
    expect(image.getAttribute('height')).toBe('400')
    expect(image.getAttribute('loading')).toBe('lazy')

    editor.commands.updateImageAttributes({title: '', width: null, height: null, loading: null, decoding: null})

    expect(image.hasAttribute('title')).toBe(false)
    expect(image.hasAttribute('width')).toBe(false)
    expect(image.hasAttribute('height')).toBe(false)
    expect(image.hasAttribute('loading')).toBe(false)
    expect(image.hasAttribute('decoding')).toBe(false)
  })

  it('块级和行内图片互转时保留所有图片属性', () => {
    const editor = createEditor()
    editor.commands.setImageWithAttributes({
      src: '/photo.png', alt: '照片', title: '说明', href: '/detail', target: '_blank', loading: 'lazy',
    })
    editor.commands.setNodeSelection(0)
    expect(editor.commands.convertImageToInline()).toBe(true)
    expect(editor.getAttributes('inlineImage')).toMatchObject({
      src: '/photo.png', alt: '照片', title: '说明', href: '/detail', target: '_blank', loading: 'lazy',
    })
    expect(editor.commands.convertInlineImageToBlock()).toBe(true)
    expect(editor.getAttributes('image')).toMatchObject({
      src: '/photo.png', alt: '照片', title: '说明', href: '/detail', target: '_blank', loading: 'lazy',
    })
  })

  it('没有选中图片时，属性与链接命令均不修改文档', () => {
    const editor = createEditor('<p>正文</p>')
    editor.commands.setTextSelection(1)
    const before = editor.getJSON()

    expect(editor.commands.updateImageAttributes({alt: '无效更新'})).toBe(false)
    expect(editor.commands.setImageLink({href: '/detail'})).toBe(false)
    expect(editor.commands.unsetImageLink()).toBe(false)
    expect(editor.getJSON()).toEqual(before)
  })
})
