import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import svgr from 'vite-plugin-svgr'

//  ---------------------------------

const env = process.env
const API_PORT = env.API_PORT || 3001
const WS_PORT = env.WS_PORT || 3002
const API_VERSION = env.API_VERSION || 'v1'
const FE_PORT = env.FE_PORT || 3000

const root = path.join(__dirname, '../src')

//  ---------------------------------

export default defineConfig({
  root,
  server: {
    port: FE_PORT,
    strictPort: true,
    host: true,
    hmr: {
      host: 'localhost',
      port: FE_PORT
    }
    // open: true
  },
  preview: {
    port: FE_PORT,
    strictPort: true,
    host: true
  },
  resolve: {
    alias: {
      '@components': path.join(root, 'components'),
      '@containers': path.join(root, 'containers'),
      '@storage': path.join(root, 'storage'),
      '@assets': path.join(root, 'assets')
    }
  },
  plugins: [
    svgr()
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          config: './tools/tailwind.config.js'
        }),
        autoprefixer()
      ]
    }
  },
  define: {
    SHARED_CONF__API_PORT: JSON.stringify(API_PORT),
    SHARED_CONF__WS_PORT: JSON.stringify(WS_PORT),
    SHARED_CONF__API_VERSION: JSON.stringify(API_VERSION)
  },
  build: {
    outDir: path.join(__dirname, '../dist'),
    emptyOutDir: true,
    minify: true
  }
})
