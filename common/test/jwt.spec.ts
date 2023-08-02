import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { JWTRig } from '../jwt'
import type { Payload, Config } from '../jwt'

const data: Payload = {
  me: 'John',
  one: 1,
  two: 2,
  correct: true
}

/*
API_PRIVATE_KEY: MIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIA7CtPiBzjLiyX4sSP7I2+ail45jU38CDhmj+f6sZwldAos8d7Jl7ecqIDCGlBIaLcaU/imU6aeVOC1Ks/hHYh1EahgYkDgYYABAEMrfUUq5t7r6YK65NahBVbV33kRCLVd0ABB3QrsLluU2ZcJr+AJ5aYWhF3BdNYi0HoHZOn/LpmmAnWw7FfeB32UwB5WbuLwXsaCXam2SeKzZdlfs1RHB5rloqjlfBtVKdKLxIos466C9wj/3di9IimxwYWWeS98cv5W8umeylWTFdZHA==

API_PUBLIC_KEY: MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBDK31FKube6+mCuuTWoQVW1d95EQi1XdAAQd0K7C5blNmXCa/gCeWmFoRdwXTWItB6B2Tp/y6ZpgJ1sOxX3gd9lMAeVm7i8F7Ggl2ptknis2XZX7NURwea5aKo5XwbVSnSi8SKLOOugvcI/93YvSIpscGFlnkvfHL+VvLpnspVkxXWRw=

API_SECRET_KEY: d52f4c216bf8b717c4b179fbed5a6a9e e2852ac7e5d5e5c4535a75443c196635
*/
const cfg: Config = {
  algo: 'ES512',
  expSec: 60,
  privateKey: 'MIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIA7CtPiBzjLiyX4sSP7I2+ail45jU38CDhmj+f6sZwldAos8d7Jl7ecqIDCGlBIaLcaU/imU6aeVOC1Ks/hHYh1EahgYkDgYYABAEMrfUUq5t7r6YK65NahBVbV33kRCLVd0ABB3QrsLluU2ZcJr+AJ5aYWhF3BdNYi0HoHZOn/LpmmAnWw7FfeB32UwB5WbuLwXsaCXam2SeKzZdlfs1RHB5rloqjlfBtVKdKLxIos466C9wj/3di9IimxwYWWeS98cv5W8umeylWTFdZHA==',
  publicKey: 'MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQBDK31FKube6+mCuuTWoQVW1d95EQi1XdAAQd0K7C5blNmXCa/gCeWmFoRdwXTWItB6B2Tp/y6ZpgJ1sOxX3gd9lMAeVm7i8F7Ggl2ptknis2XZX7NURwea5aKo5XwbVSnSi8SKLOOugvcI/93YvSIpscGFlnkvfHL+VvLpnspVkxXWRw=',
  secretKey: 'e2852ac7e5d5e5c4535a75443c196635'
}

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('JWT usage suite', () => {

  const jwt = new JWTRig(cfg)
  let token

  it('should sign data', () => {
    token = jwt.sign(data, 3/* seconds exp */)
    // console.log('+++ token:', token)
    // assert.ok(token.length > 32 && token.split('.').length === 3)
    assert.ok(token.length > 32)
  })

  it('token should be valid', () => {
    assert.ok(jwt.valid(token))
  })

  it('token should be verified', () => {
    let payload
    assert.doesNotThrow(() => {
      payload = jwt.verify(token)
    })
    /*
    console.log('payload', payload)
      payload {
        me: 'John',
        one: 1,
        two: 2,
        correct: true,
        jti: 'b7b6512b-05e6-47ea-8b03-3a4b223b6928',
        iat: 1644847863,
        exp: 1644847866
      }
    */
    delete payload.exp
    delete payload.iat
    delete payload.jti
    assert.deepStrictEqual(payload, data)
  })

  it('token should be refreshed after half of exp', async () => {
    const payload = jwt.verify(token)
    await delay(2000)
    const { token: maybeNewToken, payload: maybeNewPayload } = jwt.verifyAndMaybeRefresh(token)
    assert.notStrictEqual(token, maybeNewToken)
    assert.notStrictEqual(payload.jti, maybeNewPayload.jti)
    delete payload.exp
    delete payload.iat
    delete payload.jti
    delete maybeNewPayload.exp
    delete maybeNewPayload.iat
    delete maybeNewPayload.jti
    assert.deepStrictEqual(payload, data)
    assert.deepStrictEqual(maybeNewPayload, data)
  })

})
