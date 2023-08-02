import { build } from 'esbuild'
import conf from './esbuild.config.js'

(async () => {
  await build(conf)
  console.log('API: build done.')
})()

