// @flow
import jwt from 'jsonwebtoken'
import config from 'config'

type Issuer = 'https://api.laundree.io'
  | 'https://socket.laundree.io'
  | 'https://web.laundree.io'

type Audience = 'https://api.laundree.io'
  | 'https://socket.laundree.io'

type ExpiresIn = number | string

type Payload = {
  iss: Issuer,
  sub: 'user',
  exp: ExpiresIn,
  aud: Audience | Audience[],
  payload: { userId: string }
} | {
  iss: Issuer,
  sub: 'app',
  exp: ExpiresIn,
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

export async function signAppToken (iss: Issuer, aud: Audience | Audience[], exp: ExpiresIn = '7d'): Promise<string> {
  return sign({
    iss,
    exp,
    sub: 'app',
    aud
  })
}
