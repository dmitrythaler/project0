import { build } from 'esbuild';
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../')
const isProduction = process.env.NODE_ENV === 'production'

export const builder = async () => {
  await build({
    entryPoints: [
      { in: `${root}core.ts`, out: 'core' },
      { in: `${root}index.ts`, out: 'index' },
      { in: `${root}constants.ts`, out: 'constants' }
    ],
    outdir: `${root}dist/`,
    packages: 'external',
    target: 'node20.0.0',
    bundle: true,
    tsconfig: `${root}tsconfig.json`,
    minify: isProduction,
    sourcemap: !isProduction,
    format: 'esm',
  })
  console.log('Common: build done.')
}

builder()
