/**
 * Krill
 */
export const isObject = (val: Record<string, unknown> | unknown): boolean => val !== null && typeof val === 'object'
export const empty = (val: Record<string, unknown> | unknown[]): boolean => isObject(val) && Object.keys(val).length === 0
export const nullish = (val: unknown): boolean => val == null  // == just means (val === null || val === undefined)
export const notNullish = (val: unknown): boolean => val != null  // != just means (val !== null && val !== undefined)

const _sizeSuffixes = ['B', 'KB', 'MB', 'GB', 'TB']

export const hrSize = (size: number): string => {
  let idx = 0
  while (size > 1024) {
    size /= 1024
    ++idx
  }
  return `${Math.floor(size * 100) / 100} ${_sizeSuffixes[idx]}`
}
