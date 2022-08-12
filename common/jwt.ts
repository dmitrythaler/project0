import jwt from 'jsonwebtoken'
import { v4 as getUUID } from 'uuid'

import { APIError } from './error.js'
import type { Keyed } from './types.js'

//  ----------------------------------------------------------------------------------------------//

export type Payload = Keyed & {
  jti?: string
  exp?: number
  iat?: number
}

export type JWTRigConfig = {
  algo?: string
  expSec?: number
  publicKey: string
  privateKey?: string
}

export type RefreshResult = {
  token: string,
  payload: Payload
}

//  ---------------------------------

export class JWTRig {
  private algo: string
  private expSec: number
  private privateKey?: string
  private publicKey: string

  constructor(conf: JWTRigConfig) {
    this.algo = conf.algo || 'ES512'
    this.expSec = conf.expSec || 3600
    this.privateKey = conf.privateKey
    this.publicKey = conf.publicKey

    // restore keys converted to single string
    if (this.privateKey && !this.privateKey.includes('BEGIN')) {
      const splut: string[] = [`-----BEGIN EC PRIVATE KEY-----`]
      const len = this.privateKey.length
      let i = 0
      while (i < len) {
        splut.push(this.privateKey.slice(i, i + 64))
        i += 64
      }
      splut.push(`-----END EC PRIVATE KEY-----`)
      this.privateKey = splut.join('\n')
    }
    if (this.publicKey && !this.publicKey.includes('BEGIN')) {
      const splut: string[] = [`-----BEGIN PUBLIC KEY-----`]
      const len = this.publicKey.length
      let i = 0
      while (i < len) {
        splut.push(this.publicKey.slice(i, i + 64))
        i += 64
      }
      splut.push(`-----END PUBLIC KEY-----`)
      this.publicKey = splut.join('\n')
    }
  }

  /** update configuration
   *  @param {Partial<JWTRigConfig>} conf
   */
  reConfig(conf: Partial<JWTRigConfig>): void {
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
   *  @throws if private key is absent
   */
  sign(payload: Payload, exp?: number ): string {
    if (!this.privateKey) {
      throw new APIError(501, 'JWTRig:sign error: private key required')
    }
    exp = exp || this.expSec
    payload = { ...payload }
    payload.jti = payload.jti || getUUID()
    return jwt.sign(payload,
      this.privateKey,
      { algorithm: this.algo, expiresIn: exp } as jwt.SignOptions
    )
  }

  /** verifies JSON Web Token, returns payload
   *
   *  @param {string} token
   *  @return {object} decoded data
   *  @throws if malformed/expired
   */
  verify(token: string): Payload {
    if (!this.publicKey) {
      throw new APIError(501, 'JWTRig:verify error: public key required')
    }
    return <Payload>jwt.verify(
      token,
      this.publicKey,
      { algorithms: [this.algo] } as jwt.VerifyOptions
    )
  }

  /** check JSON Web Token validity, just return true/false
   *  @param {string} token
   *  @return {boolean}
   */
  valid(token: string): boolean {
    if (!this.publicKey) {
      throw new APIError(501, 'JWTRig:valid error: public key required')
    }
    try {
      jwt.verify(
        token,
        this.publicKey,
        { algorithms: [this.algo] } as jwt.VerifyOptions
      )
      return true
    } catch (er) {
      return false
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
      payload.jti = getUUID()
      delete payload.exp
      return { token: this.sign(payload), payload }
    }
    return { token, payload }
  }

}

