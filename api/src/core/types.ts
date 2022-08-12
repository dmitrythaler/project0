import type { Request, Response } from 'express'
import type { Keyed } from '@p0/common'
import type { User } from '@p0/dal'

export type Context = Keyed & {
  time?: number
  sessionId?: string
  user?: User.DBRecord
}

export type RequestExt = Request & { ctx?: Context }

export type APIResponse = Keyed & {
  code?: number,
  meta: {
    createdAt: Date
    apiVersion: string
    url?: string
    time?: number
  }
}

export type RouteHandler = (req?: RequestExt, res?: Response) => Promise<Keyed>



