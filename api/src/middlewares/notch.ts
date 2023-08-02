import type { /* Request,  */Response, NextFunction } from 'express'
import type { /* Context,  */RequestExt } from '../core/index.ts'

//  ---------------------------------

export default function (req: RequestExt, res: Response, next: NextFunction): void {
  req.ctx = {
    ...req.ctx,
    time: Date.now()
  }

  next()
}
