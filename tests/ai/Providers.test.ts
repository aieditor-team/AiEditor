import {describe, expect, it} from 'vitest'
import {AI_PROVIDERS, getAiProvider, getAiProviders, registerAiProvider} from '../../src/ai'

describe('AI provider registry', () => {
  it('includes common providers with usable defaults', () => {
    expect(AI_PROVIDERS.map((provider) => provider.id)).toEqual(
      expect.arrayContaining(['openai', 'deepseek', 'qwen', 'zhipu', 'moonshot']),
    )
    expect(getAiProvider('deepseek')).toMatchObject({
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
    })
  })

  it('allows applications to add and replace providers', () => {
    registerAiProvider({id: 'local', name: 'Local model', baseURL: 'http://localhost:11434/v1', model: 'llama3'})
    expect(getAiProvider('local')).toMatchObject({name: 'Local model', model: 'llama3'})
    expect(getAiProviders().some((provider) => provider.id === 'local')).toBe(true)
  })
})
