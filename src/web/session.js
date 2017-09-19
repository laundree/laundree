// @flow

import session from 'express-session'
import connectRedis from 'connect-redis'
import config from 'config'

const RedisStore = connectRedis(session)

export default session({
  secret: config.get('session.secret'),
  resave: false,
  name: config.get('session.name'),
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    secure: config.get('session.secure'),
    domain: config.get('session.domain')
  },
  saveUninitialized: false,
  store: new RedisStore({host: config.get('redis.host'), port: config.get('redis.port')})
})
