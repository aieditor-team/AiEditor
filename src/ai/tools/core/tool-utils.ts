/** 创建严格的对象 JSON Schema，默认拒绝模型传入未声明字段。 */
export function objectSchema(
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> {
  return { type: 'object', properties, required, additionalProperties: false }
}

/** 将 Responses API 返回的参数字符串解析成普通对象。 */
export function parseArguments(raw: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(raw || '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error()
    return value as Record<string, unknown>
  } catch {
    throw new Error('Tool arguments must be a JSON object')
  }
}

/** 读取必填字符串参数；`allowEmpty` 用于“删除文本”等空字符串具有业务含义的场景。 */
export function requireString(
  arguments_: Record<string, unknown>,
  key: string,
  allowEmpty = false,
): string {
  const value = arguments_[key]
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) {
    throw new Error(`${key} must be a non-empty string`)
  }
  return value
}

/** 读取整数参数，并拒绝小数、字符串数字和缺失值。 */
export function requireInteger(arguments_: Record<string, unknown>, key: string): number {
  const value = arguments_[key]
  if (!Number.isInteger(value)) throw new Error(`${key} must be an integer`)
  return value as number
}

/** 读取字符串枚举参数，并给出包含允许值的错误信息。 */
export function requireEnum(
  arguments_: Record<string, unknown>,
  key: string,
  values: readonly string[],
): string {
  const value = requireString(arguments_, key)
  if (!values.includes(value)) throw new Error(`${key} must be one of: ${values.join(', ')}`)
  return value
}

/** 将可选整数限制在安全范围；值无效时使用兜底值。 */
export function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  return Number.isInteger(value) ? Math.min(max, Math.max(min, value as number)) : fallback
}
