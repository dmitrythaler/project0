import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { EncryptionRig } from '../encrypt'

/*
API_PRIVATE_KEY: MIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIA7CtPiBzjLiyX4sSP7I2+ail45jU38CDhmj+f6sZwldAos8d7Jl7ecqIDCGlBIaLcaU/imU6aeVOC1Ks/hHYh1EahgYkDgYYABAEMrfUUq5t7r6YK65NahBVbV33kRCLVd0ABB3QrsLluU2ZcJr+AJ5aYWhF3BdNYi0HoHZOn/LpmmAnWw7FfeB32UwB5WbuLwXsaCXam2SeKzZdlfs1RHB5rloqjlfBtVKdKLxIos466C9wj/3di9IimxwYWWeS98cv5W8umeylWTFdZHA==

API_PUBLIC_KEY: MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBDK31FKube6+mCuuTWoQVW1d95EQi1XdAAQd0K7C5blNmXCa/gCeWmFoRdwXTWItB6B2Tp/y6ZpgJ1sOxX3gd9lMAeVm7i8F7Ggl2ptknis2XZX7NURwea5aKo5XwbVSnSi8SKLOOugvcI/93YvSIpscGFlnkvfHL+VvLpnspVkxXWRw=

API_SECRET_KEY: d52f4c216bf8b717c4b179fbed5a6a9e
*/

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('EncryptionRig usage suite', () => {

  let key = ''
  let rig: EncryptionRig
  const simpleData = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const longData = 'eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJtZSI6IkpvaG4iLCJvbmUiOjEsInR3byI6MiwiY29ycmVjdCI6dHJ1ZSwianRpIjoiYjdiNjUxMmItMDVlNi00N2VhLThiMDMtM2E0YjIyM2I2OTI4IiwiaWF0IjoxNjQ0ODQ3ODYzLCJleHAiOjE2NDQ4NDc4NjZ9.AWD3xgFQbUk3YqMbP0GApJSMXjgyvtnrN9duHWE2OKj2meLZUi3kp4WsK2SughhicBKrlm_q-HQoc2gdJmZpTrjeAbwuwO9i2BO5LM8j_Gx3KU1T-qQlecBXjQEuhaJIi49C_z_SwGWod_xyjsD0_FJf9vfo5uDu95jrVpAr60WhpuFL'
  let token = ''

  it('should generate a secret key', async () => {
    const len = 128
    key = await EncryptionRig.generateSecretKey(len)
    assert.ok(key)
    assert.equal(key.length, len / 4)
    rig = new EncryptionRig(key)
    console.log('+++ key:', key)
  })

  it('should encrypt/decrypt short string', () => {
    token = rig.encrypt(simpleData)
    assert.ok(token)
    const restored = rig.decrypt(token)
    assert.equal(simpleData, restored)
  })

  it('should encrypt/decrypt long string', () => {
    token = rig.encrypt(longData)
    assert.ok(token)
    const restored = rig.decrypt(token)
    assert.equal(longData, restored)
  })

  it('should decrypt short string after multiple encrypts', () => {
    let restored: string = ''
    for (let i = 0; i < 5; ++i) {
      token = rig.encrypt(simpleData)
    }
    for (let i = 0; i < 5; ++i) {
      restored = rig.decrypt(token)
    }
    assert.equal(simpleData, restored)
  })

  it('should encrypt/decrypt short string, repeatedly', () => {
    let restored: string
    for (let i = 0; i < 5; ++i) {
      token = rig.encrypt(simpleData)
      restored = rig.decrypt(token)
      assert.equal(simpleData, restored)
    }
    token = rig.encrypt(simpleData)
    const token2 = rig.encrypt(simpleData)
    const token3 = rig.encrypt(simpleData)
    assert.equal(token, token2)
    assert.equal(token, token3)
  })

  it('should encrypt/decrypt long string, repeatedly', () => {
    let restored: string
    for (let i = 0; i < 5; ++i) {
      token = rig.encrypt(longData)
      restored = rig.decrypt(token)
      assert.equal(longData, restored)
    }
  })

  it('should encrypt/decrypt strings, alternately', () => {
    let restored: string
    for (let i = 0; i < 5; ++i) {
      token = rig.encrypt(longData)
      restored = rig.decrypt(token)
      assert.equal(longData, restored)

      token = rig.encrypt(simpleData)
      restored = rig.decrypt(token)
      assert.equal(simpleData, restored)
    }
  })

})
