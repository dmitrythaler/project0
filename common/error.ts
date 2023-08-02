import { randomUUID } from 'node:crypto'
import type { IAPIError } from './types.ts'

const httpCodes = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
}

//  to clear stack trace from those annoying lines with node_modules/internal
const sysModulesLineRE = /^.*(node_modules|(internal\/(main|modules|timers))).*\n*/img

export class APIError extends Error implements IAPIError {
  id: string
  code: number
  fatal: boolean
  shortStack: string

  constructor (code: number | Error, message?: string, fatal?: boolean) {
    if (typeof code === 'number') {
      message = message ? ` (${message})` : ' '
      super(`${httpCodes[code] || ''}${message}`)
      this.code = code
      // fatal default false
      this.fatal = fatal || false
    } else {
      super(`${httpCodes[500]} (${code.toString()})`)
      this.code = 500
      // fatal default true
      this.fatal = fatal === undefined || fatal
    }
    this.name = 'API Error'
    this.stack = (this.stack || '')
    this.shortStack = this.stack.replace(sysModulesLineRE, '')
    this.id = randomUUID()
  }

  plainObject(opts: { message?: boolean, stack?: boolean } = { message: true, stack: true }): IAPIError {
    // const { id, code, shortStack: stack, message } = this
    const { id, code, stack, name, message, fatal } = this
    const plain: IAPIError = { id, code, name, message: '', fatal }
    if (opts.message) {
      plain.message = message
    }
    if (opts.stack) {
      plain.stack = stack
    }
    return plain
  }
}

