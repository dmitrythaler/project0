import bcrypt from 'bcrypt'

import { APIError } from './error.js'
export { APIError }
export { JWTRig } from './jwt.js'
export { logger } from './logger.js'
export { ColorLevel } from './types.js'
export type { Payload, JWTRigConfig, RefreshResult } from './jwt.js'
import type { Keyed } from './types.js'
export type { Keyed }

//  ----------------------------------------------------------------------------------------------//

/** creates bcrypt hash
 *  @param {string} text - value to get hash from
 *  @return {string} hash
 */
export const getHash = (text: string, hashRoundsNum = 12): string => bcrypt.hashSync(text, hashRoundsNum)

/** compare provided text with bcrypt hash
 *  @param {string} password - value to test
 *  @param {string} hash - previously hashed value to compare with
 *  @return {boolean}
 */
export const compare2Hash = (password: string, hash: string): boolean => bcrypt.compareSync(password, hash)

const camel2SnakeCase = (text: string): string => text
  .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
  .replace(/([a-z])([A-Z])/g, '$1_$2')
  .replace(/([a-zA-Z])([0-9])/g, '$1_$2')
  .replace(/([a-z])([0-9])/g, '$1_$2')
  .replace(/([0-9])([a-zA-Z])/g, '$1_$2')
  .toLowerCase()
  // .replace(/ /g, '_')

const snake2CamelCase = (text: string): string => text
  .toLowerCase()
  .replace(/(_[a-z0-9])/g, gr => gr
    .toUpperCase()
    .replace('_', '')
  )

/** make a __shallow__ copy of the provided object replacing camelCase properties to snake_case
 *  i.e. createdAt and firstName become created_at and first_name
 *  @param {object} data - arbitrary
 *  @return {object}
 */
export const mapToDBRecord = <T, R>(data: T): R => {
  const mapped = {} as R
  for (const k in data) {
    mapped[camel2SnakeCase(k)] = data[k]
  }
  return mapped
}

/** make a __shallow__ copy of the provided object replacing snake_case properties to camelCase
 *  i.e. created_at and first_name become createdAt and firstName
 *  @param {object} data - arbitrary
 *  @return {object}
 *
 *  HEADS UP: it converts "date_in_utc" to "dateInUtc", so if the original string was "dateInUTC" that means deep shit
 *  then use below anyMapper method to manual adjustment
 */
export const mapFromDBRecord = <T, R>(data: T): R => {
  const mapped: R = {} as R
  for (const k in data) {
    mapped[snake2CamelCase(k)] = data[k]
  }
  return mapped
}

/** elegant dirty hack to rename fields in the object according to mapper
 *
 *  @param {object} data - arbitrary
 *  @param {object} mapper - { newname: 'oldname',... }
 *  @return {object}
 */
export const anyMapper = <T>(data: T, mapper: Record<string, string> = {}): T => {
  const mapped = {
    ...data
  }
  for (const k in mapper) {
    data[mapper[k]] !== undefined && (mapped[k] = data[mapper[k]])
    delete mapped[mapper[k]]
  }
  return mapped
}

/**
 * Minor DB generics
 */

export const removeUuid = <U>(entity: U): U => {
  delete (<Record<'uuid', unknown>>entity).uuid
  return entity
}

export const validateInput = <U, V = U>(input: U, requiredProps: string[]): V => {
  for (const prop of requiredProps) {
    if (input[prop] === undefined || (typeof input[prop] !== 'boolean' && !input[prop])) {
      throw new APIError(400, `Insufficient input data provided: [${prop}]`)
    }
  }
  return <V><unknown>input
}

export const assertDefined = <T>(input: T): Exclude<T, undefined> => {
  if (input === undefined) {
    throw new APIError(400, `Asserion failure: input undefined`)
  }
  return <Exclude<T, undefined>>input
}

export const assertNonNullable = <T>(input: T): NonNullable<T> => {
  if (input == null) {
    throw new APIError(400, `Asserion failure: input undefined or null`)
  }
  return <NonNullable<T>>input
}

/**
 * debug utility to show human readable mem usage
 *
 * @returns {object} - {
      RSS: "177.54 MB -> Resident Set Size - total memory allocated for the process execution",
      HeapTotal: "102.3 MB -> total size of the allocated heap",
      HeapUsed: "94.3 MB -> actual memory used during the execution",
      External: "3.03 MB -> V8 external memory"
    }
 */
export const getMemoryUsage = (): {
  RSS: string
  HeapTotal: string
  HeapUsed: string
  External: string
} => {
  const fmtMem = num => `${Math.round(num / 1024 / 1024 * 100) / 100} MB`
  const data = process.memoryUsage()

  return {
    RSS: `${fmtMem(data.rss)} -> Resident Set Size - total memory allocated for the process execution`,
    HeapTotal: `${fmtMem(data.heapTotal)} -> total size of the allocated heap`,
    HeapUsed: `${fmtMem(data.heapUsed)} -> actual memory used during the execution`,
    External: `${fmtMem(data.external)} -> V8 external memory`,
  }
}

/**
 * utility to convert a ReadableStream to a Buffer
 *
 * @param {NodeJS.ReadableStream} stream
 * @returns {Promise<Buffer>}
 */
export const streamToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk) => chunks.push(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolve(Buffer.concat(chunks as Uint8Array[])))
  })
}

/**
 * Krill
 */
export const isObject = (val: Keyed | unknown): boolean => val !== null && typeof val === 'object'
export const empty = (val: Keyed | unknown[]): boolean => isObject(val) && Object.keys(val).length === 0
export const nullish = (val: unknown): boolean => val == null  // == just means (val === null || val === undefined)
export const notNullish = (val: unknown): boolean => val != null  // != just means (val !== null && val !== undefined)
