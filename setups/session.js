/**
 * Created by budde on 26/04/16.
 */
var session = require('express-session')
var RedisStore = require('connect-redis')(session)
var config = require('../config')

function setup (app) {
  app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore(config.redis)
  }))
}

module.exports = setup
