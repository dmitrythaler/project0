#!/usr/bin/node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { EncryptionRig } from '@p0/common'

//  ---------------------------------
const root = join(dirname(fileURLToPath(import.meta.url)), '../')
const templateFile = `${root}tools/secrets.dev-template.yml`
const secretsFile = `${root}tools/secrets.dev.yml`
console.log(`Keys generation, file ${secretsFile}`)
try {
  const { privateKey, publicKey } = EncryptionRig.generateECKeyPair()
  const secretKey = await EncryptionRig.generateSecretKey()
  const content = readFileSync(templateFile, 'utf8')
    .replace(/API_PRIVATE_KEY:.*\n/g, `API_PRIVATE_KEY: ${privateKey}\n`)
    .replace(/API_PUBLIC_KEY:.*\n/g, `API_PUBLIC_KEY: ${publicKey}\n`)
    .replace(/API_SECRET_KEY:.*\n/g, `API_SECRET_KEY: ${secretKey}\n`)
  writeFileSync(secretsFile, content)
  console.log('done.')
  process.exit(0)
} catch (error) {
  console.error('Error:', error)
  process.exit(1)
}
