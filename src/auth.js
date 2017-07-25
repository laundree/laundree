// @flow
import jwt from 'jsonwebtoken'
import config from 'config'

type Issuer = 'https://api.laundree.io'
  | 'https://socket.laundree.io'
  | 'https://web.laundree.io'

type Audience = 'https://api.laundree.io'
  | 'https://socket.laundree.io'

export type Payload = {
  iss: Issuer,
  sub: 'user',
  exp: number,
  aud: Audience | Audience[],
  payload: { userId: string }
} | {
  iss: Issuer,
  sub: 'app',
  exp: number,
  aud: Audience | Audience[]
}

function sign (payload: Payload): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      config.get('auth.secret'),
      (err, data) => {
        if (err) reject(err)
        else resolve(data)
      }
    )
  })
}

export function verify (token: string, audience: Audience) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      config.get('auth.secret'),
      {
        audience,
        issuer: ['https://api.laundree.io', 'https://socket.laundree.io', 'https://web.laundree.io']
      },
      (err, data) => {
        if (err) reject(err)
        else resolve(data)
      }
    )
  })
}

export async function signAppToken (iss: Issuer, aud: Audience | Audience[], exp: number): Promise<string> {
  return sign({
    iss,
    exp,
    sub: 'app',
    aud
  })
}
