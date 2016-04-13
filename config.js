var config = {
  web: {},
  redis: {}
}

config.web.port = process.env.PORT || 3000

config.redis.host = process.env.REDIS_HOST || 'localhost'
config.redis.port = process.env.REDIS_PORT || 6379

module.exports = config
