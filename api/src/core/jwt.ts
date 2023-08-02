import { JWTRig, assertNonNullable } from '@p0/common'

const {
  API_PUBLIC_KEY,
  API_PRIVATE_KEY,
  API_SECRET_KEY,
  AUTH_EXP_SEC
} = process.env

assertNonNullable(API_PUBLIC_KEY, 'Public Key env variable is not set!', 500)
assertNonNullable(API_PRIVATE_KEY, 'Private Key env variable is not set!', 500)
// absence of the secret key means cookies shouldn't be encrypted

const jwt = new JWTRig({
  expSec: parseFloat(AUTH_EXP_SEC || '3600'),
  privateKey: API_PRIVATE_KEY,
  publicKey: API_PUBLIC_KEY,
  secretKey: API_SECRET_KEY
})

export { jwt }
