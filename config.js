var config = {
  web: {},
  redis: {},
  facebook: {},
  google: {},
  session: {},
  mongo: {}
}

config.web.port = process.env.PORT || 3000

config.redis.host = process.env.REDIS_HOST || 'localhost'
config.redis.port = process.env.REDIS_PORT || 6379

config.mongo.url = process.env.MONGO_URL || 'mongodb://localhost/laundree'

config.facebook.appId = process.env.FACEBOOK_CLIENT_ID || '1044245858966868'
config.facebook.appSecret = process.env.FACEBOOK_CLIENT_SECRET || '394f0ef62fd8d104e110ba898afeeb4a'
config.facebook.callbackUrl = process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/auth/facebook/callback'

config.google.clientId = process.env.GOOGLE_CLIENT_ID || '1098336985149-el1jqcb5j7d3oldav4csv0nh976pvsch.apps.googleusercontent.com'
config.google.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '0uWixpXV9BwwXTTeZYm0fvls'
config.google.callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'

config.session.secret = process.env.SESSION_SECRET || 'secret1234'

module.exports = config
