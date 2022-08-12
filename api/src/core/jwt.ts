import { JWTRig } from '@p0/common'

const {
  API_PUBLIC_KEY,
  API_PRIVATE_KEY,
  AUTH_EXP_SEC
} = process.env

const jwt = new JWTRig({
  expSec: parseFloat(AUTH_EXP_SEC || '0') || 3600,
  privateKey: API_PRIVATE_KEY || '',
  publicKey: API_PUBLIC_KEY || ''
})

export { jwt }
