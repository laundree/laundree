/**
 * Created by budde on 26/04/16.
 */
var session = require('express-session')
var RedisStore = require('connect-redis')(session)
var config = require('config')

function setup (app) {
  app.use(session({
    secret: config.get('session.secret'),
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({host: config.get('redis.host'), port: config.get('redis.port')})
  }))
}

module.exports = setup
