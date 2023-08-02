import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  generateKeyPairSync,
  generateKey
} from 'node:crypto'

import type { Cipher } from 'node:crypto'

//  ----------------------------------------------------------------------------------------------//

export type KeyPair = {
  privateKey: string
  publicKey: string
}

//  ---------------------------------
export class EncryptionRig {
  private static ALGO = 'aes-256-ctr'
  private static CURVE = 'secp521r1'
  private iv: Buffer
  private key: string

  constructor(key: string) {
    this.iv = randomBytes(16)
    this.key = key
  }

  /**
   * Encrypt provided string
   *
   * @param {string} input - input data to encrypt
   * @return {string} ebcrypted data as hex string
   */
  encrypt(input: string): string {
    const cipher = createCipheriv(EncryptionRig.ALGO, this.key, this.iv)
    return cipher.update(input).toString('hex')
  }

  /**
   * Decrypt provided string
   *
   * @param {string} input - input data as hex string to decrypt
   * @return {string} decrypted data
   */
  decrypt(input: string): string {
    const decipher = createDecipheriv(EncryptionRig.ALGO, this.key, this.iv)
    return decipher.update(Buffer.from(input, 'hex')).toString()
  }

  /**
   * generate ec key pair
   *
   * @returns {KeyPair}
   */
  static generateECKeyPair() {
    const {
      publicKey,
      privateKey,
    } = generateKeyPairSync('ec', {
      namedCurve: EncryptionRig.CURVE,
      publicKeyEncoding: {
        type: 'spki',
        format: 'der',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der',
      }
    })
    return {
      publicKey: publicKey.toString('base64'),
      privateKey: privateKey.toString('base64')
    }
  }

  /**
   * generate hmac key
   *
   * @param {[string]} len - length of the key, optional, default 128
   * @returns {string} hex encoded key
   */
  static async generateSecretKey(len = 128): Promise<string> {
    return new Promise((resolve, reject) => {
      generateKey('hmac', { length: len }, (err, key) => {
        if (err) {
          return reject(err)
        }
        resolve(key.export().toString('hex'))
      })
    })
  }

}
