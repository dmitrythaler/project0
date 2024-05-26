import type { Request, Response } from 'express'
import type { Player } from '@p0/dal'

export type Context = Record<string, unknown> & {
  time?: number
  sessionId?: string
  user?: Player
}

export type RequestExt = Request & { ctx?: Context }

export type APIResponse = Record<string, unknown> & {
  code?: number,
  meta: {
    createdAt: Date
    apiVersion: string
    url?: string
    time?: number
  }
}

export type RouteHandler = (req?: RequestExt, res?: Response) => Promise<Record<string, unknown>>



