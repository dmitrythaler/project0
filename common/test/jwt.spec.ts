import assert from 'assert'
import { JWTRig } from '../jwt'
import type { Payload, JWTRigConfig, RefreshResult } from '../jwt'

const data: Payload = {
  me: 'John',
  one: 1,
  two: 2,
  correct: true
}


//  generated with :
// ssh-keygen -b 521 -t ecdsa -m PEM -C "$KEY_OWN" -f "$KEY_FILE_NAME" -q -N ""
// openssl ec -in "$KEY_FILE_NAME" -pubout -outform PEM -out "${KEY_FILE_NAME}.pub"
//  then prefix, suffix and lineends were removed with something like:
// sed -e "s/-----BEGIN EC PRIVATE KEY-----//" -e "s/-----END EC PRIVATE KEY-----//" -z -e "s/\n//g" ${KEY_FILE_NAME}

const cfg: JWTRigConfig = {
  algo: 'ES512',
  expSec: 60,
  privateKey: `MIHcAgEBBEIBYBaKqmKsxW5U/BUmMkKLbv5vyTsJsVgSZERqRlOheQe4edz15O2DfwtjxOlLvsjB6uHWl41pTe6TzzIoz80pFZ+gBwYFK4EEACOhgYkDgYYABACGZHDQkaTpXcSeePqDlH+qHcDF9Zvt6jIe/YORZ/KfG4Gtd5Dmzf3BLKukQxD+XSdszIWQhdAWUWTiyqS6TtKOrABTWrSyWEQbawkSoP/LPY9fUjesaqZnHULPmQ4KeEp0KG7ZzDkLJjv/YPCb0IILl2asVlH0N8W674F7UrVD3iqhdQ==`,
  publicKey: `MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQAhmRw0JGk6V3Ennj6g5R/qh3AxfWb7eoyHv2DkWfynxuBrXeQ5s39wSyrpEMQ/l0nbMyFkIXQFlFk4sqkuk7SjqwAU1q0slhEG2sJEqD/yz2PX1I3rGqmZx1Cz5kOCnhKdChu2cw5CyY7/2Dwm9CCC5dmrFZR9DfFuu+Be1K1Q94qoXU=`
//   publicKey: `-----BEGIN PUBLIC KEY-----
// MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQAhmRw0JGk6V3Ennj6g5R/qh3AxfWb
// 7eoyHv2DkWfynxuBrXeQ5s39wSyrpEMQ/l0nbMyFkIXQFlFk4sqkuk7SjqwAU1q0
// slhEG2sJEqD/yz2PX1I3rGqmZx1Cz5kOCnhKdChu2cw5CyY7/2Dwm9CCC5dmrFZR
// 9DfFuu+Be1K1Q94qoXU=
// -----END PUBLIC KEY-----`,
//   privateKey: `-----BEGIN EC PRIVATE KEY-----
// MIHcAgEBBEIBYBaKqmKsxW5U/BUmMkKLbv5vyTsJsVgSZERqRlOheQe4edz15O2D
// fwtjxOlLvsjB6uHWl41pTe6TzzIoz80pFZ+gBwYFK4EEACOhgYkDgYYABACGZHDQ
// kaTpXcSeePqDlH+qHcDF9Zvt6jIe/YORZ/KfG4Gtd5Dmzf3BLKukQxD+XSdszIWQ
// hdAWUWTiyqS6TtKOrABTWrSyWEQbawkSoP/LPY9fUjesaqZnHULPmQ4KeEp0KG7Z
// zDkLJjv/YPCb0IILl2asVlH0N8W674F7UrVD3iqhdQ==
// -----END EC PRIVATE KEY-----`
}

const delay = ms => new Promise(res => setTimeout(res, ms))

describe('JWT usage suite', () => {

  const jwt = new JWTRig(cfg)
  let token

  it('should sign data', () => {
    token = jwt.sign(data, 3/* seconds exp */)
    /*
    console.log('+++ token:', token)
      token: eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJtZSI6IkpvaG4iLCJvbmUiOjEsInR3byI6MiwiY29ycmVjdCI6dHJ1ZSwianRpIjoiYjdiNjUxMmItMDVlNi00N2VhLThiMDMtM2E0YjIyM2I2OTI4IiwiaWF0IjoxNjQ0ODQ3ODYzLCJleHAiOjE2NDQ4NDc4NjZ9.AWD3xgFQbUk3YqMbP0GApJSMXjgyvtnrN9duHWE2OKj2meLZUi3kp4WsK2SughhicBKrlm_q-HQoc2gdJmZpTrjeAbwuwO9i2BO5LM8j_Gx3KU1T-qQlecBXjQEuhaJIi49C_z_SwGWod_xyjsD0_FJf9vfo5uDu95jrVpAr60WhpuFL
    */
    assert.ok(token.length > 32 && token.split('.').length === 3)
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
      console.log('payload', payload) >>
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
