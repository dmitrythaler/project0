import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import postcssImport from 'postcss-import'
import StylePlugin from 'esbuild-style-plugin'
import SvgrPlugin from 'esbuild-svg'

const env = process.env
const NODE_ENV = env.NODE_ENV
const API_PORT = parseFloat(env.API_PORT || '3001')
const WS_PORT = parseFloat(env.WS_PORT || '3002')
const FE_PORT = parseFloat(env.FE_PORT || '3000')
const API_VERSION = env.API_VERSION || 'v1'

const root = join(dirname(fileURLToPath(import.meta.url)), '../')
const isProduction = NODE_ENV === 'production'
//  ---------------------------------

const conf = {
  entryPoints: [
    'src/main.tsx',
    'src/index.html'
  ],
  outdir: `${root}dist/`,
  define: {
    'process.env.NODE_ENV': `"${NODE_ENV}"`,
    SHARED_CONF__API_PORT: `${API_PORT}`,
    SHARED_CONF__WS_PORT: `${WS_PORT}`,
    SHARED_CONF__API_VERSION: `"${API_VERSION}"`,
    SHARED_CONF__PRODUCTION: `${isProduction}`
  },
  target: 'es2020',
  platform: 'browser',
  bundle: true,
  tsconfig: `${root}tsconfig.json`,
  minify: isProduction,
  sourcemap: false,
  // format: 'esm',
  // packages: 'external',
  assetNames: 'assets/[name]-[hash]',
  loader: {
    '.html': 'copy',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file',
    '.woff': 'file',
    '.woff2': 'file',
  },
  plugins: [
    SvgrPlugin({ exportType: 'default', icon: true }),
    StylePlugin({
      postcss: {
        plugins: [
          postcssImport(),
          tailwindcss({ config: `${root}tools/tailwind.config.js` }),
          autoprefixer()
        ]
      }
    }),
  ]
}

export default conf
