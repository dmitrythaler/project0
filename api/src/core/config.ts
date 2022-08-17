// import path from 'path'
// import dotenv from 'dotenv'

const {
  NODE_ENV,
  HOST,
  API_PORT,
  WS_PORT,
  PORT,
  TAG,
  COMMIT_HASH
} = process.env
const nodeEnv = NODE_ENV || 'development'
const host = HOST || 'localhost'
const port: number = parseFloat(API_PORT || PORT || '3001')
const wsPort: number = parseFloat(WS_PORT || '0') || port + 1

// dotenv.config({
//   path: path.resolve(process.cwd(), `.env.${nodeEnv}`)
// })

export const config = {
  env: nodeEnv,
  api: 'v1',
  name: '@p0/api',
  description: 'Project Zero, API container',
  version: TAG || '1.0.0',
  gitHash: COMMIT_HASH || '<unknown>',
  host,
  port,
  wsPort
}
