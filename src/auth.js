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
  iat: number,
  aud: Audience | Audience[],
  userId: string
} | {
  iss: Issuer,
  sub: 'app',
  exp: number,
  iat: number,
  aud: Audience | Audience[]
}

type Subject = 'app' | 'user'

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

export async function verify (token: string, {audience, subject}: { audience?: Audience, subject?: Subject }): Promise<Payload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      config.get('auth.secret'),
      {
        audience,
        subject,
        issuer: ['https://api.laundree.io', 'https://socket.laundree.io', 'https://web.laundree.io']
      },
      (err, data) => {
        if (err) reject(err)
        else resolve(data)
      }
    )
  })
}

export async function signAppToken (iss: Issuer, aud: Audience | Audience[], exp: number = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60): Promise<string> {
  return sign({
    iss,
    iat: Math.ceil(Date.now() / 1000),
    exp,
    sub: 'app',
    aud
  })
}

export function verifyExpiration (token: string | Payload, maxAge: number): boolean {
  if (typeof token === 'string') {
    return verifyExpiration(jwt.decode(token), maxAge)
  }
  const nowInSeconds = Date.now() / 1000
  return Math.min(token.exp, token.iat + maxAge) > nowInSeconds
}

export async function signUserToken (userId: string, iss: Issuer, aud: Audience | Audience[], exp: number): Promise<string> {
  return sign({
    iss,
    iat: Math.ceil(Date.now() / 1000),
    exp,
    sub: 'user',
    aud,
    userId
  })
}
