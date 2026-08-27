import {describe, expect, it} from 'vitest'
import {
  ImageAlignmentFloatingMenu,
  InlineImageFloatingMenu,
  MediaAlignmentFloatingMenu,
  TableFloatingMenu,
} from '../../../src/features/floating'

describe('floating operation menu initial placement', () => {
  it.each([
    ['block image', () => new ImageAlignmentFloatingMenu()],
    ['inline image', () => new InlineImageFloatingMenu()],
    ['media', () => new MediaAlignmentFloatingMenu()],
    ['table', () => new TableFloatingMenu()],
  ])('uses intrinsic width before the first Floating UI measurement: %s', (_, createMenu) => {
    const menu = createMenu()

    expect(menu.element.style.width).toBe('max-content')

    menu.destroy()
  })
})
