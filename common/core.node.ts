import { uuidv7 } from "uuidv7-js";
import removeAccents from 'remove-accents'
import { APIError } from './error.ts'

import type { WithDates } from './types.ts'
//  ---------------------------------

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

export const cleanUpSlug = (name: string): string =>
  encodeURIComponent(
    removeAccents(
      name.replace(/[.,_()* =+@&^%$#!?]/g, '-')
        .replace(/-+$|^-+/g, '')
        .replace(/--+/g, '-')
    ).toLowerCase()
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
 * Minor generics
 */
export const removeProp = <U>(entity: U, prop: keyof U): U => {
  delete entity[prop]
  return entity
}

export const validateInput = <U>(
  input: U,
  requiredProps: (keyof U)[]
): U => {
  const absent: (keyof U)[] = []
  for (const prop of requiredProps) {
    if (input[prop] === undefined) {
      absent.push(prop)
    }
  }
  if (absent.length) {
    throw new APIError(400, `Insufficient data provided, the following properties are missing: "${absent.join('", "')}"`)
  }
  return input
}

export const setCreatedAt = <T extends WithDates>(entity: T): T => ({
  ...entity,
  createdAt: new Date(),
  updatedAt: null
})

export const setUpdatedAt = <T extends WithDates>(entity: T): T => ({
  ...entity,
  updatedAt: new Date()
})


// TypeScript cannot use arrowFunctions for assertions, workaround for the 2 next below
// https://github.com/microsoft/TypeScript/issues/34523#issuecomment-700491122

export const assertDefined: <T>(input: T, msg?: string, code?: number) => asserts input is Exclude<T, undefined> = (input, msg, code) => {
  if (input === undefined) {
    throw new APIError(code || 400, msg || 'Asserion failure: input undefined')
  }
}

export const assertNonNullable: <T>(input: T, msg?: string, code?: number) => asserts input is NonNullable<T> = (input, msg, code) => {
  if (input == null) {
    throw new APIError(code || 400, msg || `Asserion failure: input undefined or null`)
  }
}

export const assert = (expression: boolean, msg: string, code = 400) => {
  if (!expression) {
    throw new APIError(code, msg)
  }
}

export const assertMinLength = <T extends string | unknown[]>(input: T, minLength: number, msg?: string, code?: number): void => {
  if (input.length < minLength) {
    throw new APIError(code || 400, msg || `Asserion failure: input length less than ${minLength}`)
  }
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
 * Branded strings utils
 */

export const genUUID = <T = string>(): T => {
  return uuidv7() as T
}

export const makeBrandedValue = <T extends string>(input: string): T => {
  return input as T
}


