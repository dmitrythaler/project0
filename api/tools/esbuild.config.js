import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../')
const isProduction = process.env.NODE_ENV === 'production'

//  ---------------------------------
const conf = {
  entryPoints: [`${root}src/server.ts`],
  outdir: `${root}dist/`,
  packages: 'external',
  platform: 'node',
  target: 'node20.0.0',
  bundle: true,
  tsconfig: `${root}tsconfig.json`,
  minify: isProduction,
  sourcemap: !isProduction,
  format: 'esm',
}
export default conf
