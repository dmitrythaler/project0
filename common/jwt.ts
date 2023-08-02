import { randomUUID, createPrivateKey, createPublicKey } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { EncryptionRig } from './encrypt.ts'

import type { KeyObject } from 'node:crypto'

//  ----------------------------------------------------------------------------------------------//
type SomeObj = Record<string, unknown | Record<string, unknown | Record<string, unknown>>>
export type Payload = SomeObj & {
  jti?: string
  exp?: number
  iat?: number
}

export type Config = {
  algo?: string
  expSec?: number
  publicKey: string
  privateKey: string
  secretKey?: string  //  if provided the rig encrypts the token
}

export type RefreshResult = {
  token: string,
  payload: Payload
}

//  ---------------------------------

export class JWTRig {
  private algo: string
  private expSec: number
  private privateKey: KeyObject
  private publicKey: KeyObject
  private encryptor: EncryptionRig|null = null

  constructor(conf: Config) {
    this.algo = conf.algo || 'ES512'
    this.expSec = conf.expSec || 3600

    // load keys from PEM/DER strings
    this.privateKey = conf.privateKey.includes('-----BEGIN')
      ? createPrivateKey(conf.privateKey) // PEM
      : createPrivateKey({                // DER
          key: Buffer.from(conf.privateKey, 'base64'),
          format: 'der',
          type: 'pkcs8',
        })
    this.publicKey = conf.publicKey.includes('-----BEGIN')
      ? createPublicKey(conf.publicKey) // PEM
      : createPublicKey({               // DER
          key: Buffer.from(conf.publicKey, 'base64'),
          format: 'der',
          type: 'spki',
        })
    if (conf.secretKey) {
      this.encryptor = new EncryptionRig(conf.secretKey)
    }
  }

  /** update configuration
   *  @param {Partial<Config>} conf
   */
  reConfig(conf: Partial<Config>): void {
    for (const k in conf) {
      this[k] = conf[k]
    }
  }

  /**
   * @getters
   */
  getExpSec() {
    return this.expSec
  }

  /** create JSON Web Token
   *
   *  @param {object} payload - data to sign and encode
   *  @param {number} exp - expiration time in seconds
   *  @return {string} signed and encoded payload
   */
  sign(payload: Payload, exp?: number ): string {
    exp = exp || this.expSec
    payload = { ...payload }
    payload.jti = payload.jti || randomUUID()
    const token = jwt.sign(payload,
      this.privateKey,
      { algorithm: this.algo, expiresIn: exp } as jwt.SignOptions
    )
    return this.encryptor ? this.encryptor.encrypt(token) : token
  }

  /** verifies JSON Web Token, returns payload
   *
   *  @param {string} token
   *  @return {object} decoded data
   *  @throws if malformed/expired
   */
  verify(token: string): Payload {
    return <Payload>jwt.verify(
      this.encryptor ? this.encryptor.decrypt(token) : token,
      this.publicKey,
      { algorithms: [this.algo] } as jwt.VerifyOptions
    )
  }

  /** check JSON Web Token validity, no throw, return null if invalid
   *  @param {string} token
   *  @return {boolean}
   */
  valid(token: string): Payload|null {
    try {
      return this.verify(token)
    } catch (er) {
      return null
    }
  }

  /**
   * Verify provided token then
   *   if it is more then half-life expired - create the new one with the same payload and return it
   *   otherwise return same token
   *
   * @param {string} token
   * @param {boolean} force - do not check expiration
   * @return {RefreshResult} structure which contains token and payload
   * @throws if token expired/malformed
   */
  verifyAndMaybeRefresh(token: string, force = false): RefreshResult {
    const payload = this.verify(token)
    if (force || (payload.exp as number) - (payload.iat as number) < this.expSec / 2) {
      //  recreate token
      payload.jti = randomUUID()
      delete payload.exp
      return { token: this.sign(payload), payload }
    }
    return { token, payload }
  }

}

