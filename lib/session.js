/**
 * Created by budde on 26/04/16.
 */
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const config = require('config')

module.exports = session({
  secret: config.get('session.secret'),
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({host: config.get('redis.host'), port: config.get('redis.port')})
})
