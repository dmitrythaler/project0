export type * as JWT from './jwt.ts'

export type TypeCopy<T> = { [K in keyof T]: T[K] }

export type UnknownObject =
  Record<string, unknown |
    Record<string, unknown |
      Record<string, unknown |
        Record<string, unknown
        >>>>

export type AppEvent = {
  source: string
  event: string
  time?: string | Date
  data: UnknownObject
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
  payload: UnknownObject
}


export type Entity = 'Org' | 'Place' | 'Menu' | 'Media' | 'Client' | 'User'
export type Player = Extract<Entity, 'Client' | 'User'>

declare const _brand_: unique symbol
type Branded<T, B> = T & { readonly [_brand_]: B }

// branded string types for IDs
type UUIDString = `${string}-${string}-${string}-${string}-${string}`

export type PlayerID = Branded<UUIDString, 'PlayerID'>
export type MediaID = Branded<UUIDString, 'MediaID'>
export type OrgID = Branded<UUIDString, 'OrgID'>
export type MenuID = Branded<UUIDString, 'MenuID'>
export type PlaceID = Branded<UUIDString, 'PlaceID'>

export type SomeID = PlayerID | MediaID | OrgID | MenuID | PlaceID

export type WithDates = {
  createdAt?: Date
  updatedAt?: Date
}
