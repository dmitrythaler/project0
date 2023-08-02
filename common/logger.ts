import { createLogger } from 'lean-logger'

const logger = createLogger({
  http: process.env.NODE_ENV !== 'production'
})

export { logger }
