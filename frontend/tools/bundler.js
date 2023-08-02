import {
  build,
  context
} from 'esbuild'
import conf from './esbuild.config.js'

//  ---------------------------------

const staticServer = async () => {
  let ctx = await context(conf)
  await ctx.serve({
    host: '127.0.0.1',
    port: parseFloat(process.env.FE_PORT || '3000'),
    servedir: conf.outdir || 'dist',
  })
  console.log('serve ...')
}

;(async () => {
  await build(conf)
  console.log('F/E: build done...')

  // uncomment to test
  // await staticServer()
})()
