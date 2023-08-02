export type * as JWT from './jwt.ts'

export type TypeCopy<T> = { [K in keyof T]: T[K] }

export type ObjectLevel4 =
  Record<string, unknown |
    Record<string, unknown |
      Record<string, unknown |
        Record<string, unknown
  >>>>

export type AppEvent = {
  source: string
  event: string
  time?: string|Date
  data: ObjectLevel4
}

export type AppStatus = {
  desc: string
  version: string
  env: string
  hash: string
  db: string
}

export interface IAPIError {
  name: string
  message: string
  id: string
  code: number
  fatal: boolean
  stack?: string
  shortStack?: string
}

export type AppAction = {
  type: string
  payload: ObjectLevel4
}
