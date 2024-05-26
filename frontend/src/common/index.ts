import axios from 'axios'

import type * as A from 'axios'
import type { IAPIError } from '@p0/common/types'

//  ---------------------------------
export type ErrorPayload = A.AxiosError | Error
export const errorPayload = (err: ErrorPayload): IAPIError => (<any>err).response
  ? (<A.AxiosError>err).response!.data as IAPIError
  : {
      name: 'Error',
      message: err.message || 'Browser execution error',
      code : 0,
      id : 'N/A',
      fatal: false
    }

//  ---------------------------------
export const timeString = (t: string|Date|undefined|null, def = '') =>
  t
    ? (typeof t === 'string' ? t : t.toISOString()).slice(0, -5).replace('T', ' ')
    : def


//  ---------------------------------
//  config
const hostname = window.location.hostname
const protocol = window.location.protocol

// this consts are being kept by esbuild
declare const SHARED_CONF__API_PORT: string
declare const SHARED_CONF__WS_PORT: string
declare const SHARED_CONF__API_VERSION: string

const api = {
  port: SHARED_CONF__API_PORT,
  wsPort: SHARED_CONF__WS_PORT,
  version: SHARED_CONF__API_VERSION
}

const conf = {
  api,
  hostname: hostname,
  protocol: protocol,
  wsProtocol: protocol === 'https:' ? 'wss:' : 'ws:',
  baseURL: `${protocol}//${hostname}:${api.port}/api/${api.version}/`,
}

export const apiInstance = axios.create({
  baseURL: conf.baseURL,
  withCredentials: true,
  responseType: 'json'
})

export default conf
