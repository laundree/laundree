/**
 * Created by budde on 05/05/16.
 */
const Promise = require('promise')
var path = require('path')
var YAML = require('yamljs')
var swaggerTools = require('swagger-tools')
var config = require('config')
var passport = require('passport')
const {logError} = require('../utils/error')
const {opbeat} = require('../lib/opbeat')

function setup (app) {
  return new Promise((resolve, reject) => {
    YAML.load(path.join(__dirname, '..', 'api', 'swagger', 'swagger.yaml'),
      (result) => swaggerTools.initializeMiddleware(result, (middleware) => {
        app.use(middleware.swaggerMetadata())
        app.use((req, res, next) => {
          if (!opbeat) return next()
          if (!req.swagger || !req.swagger.apiPath) return next()
          opbeat.setTransactionName(`${req.method} /api${req.swagger.apiPath}`)
          next()
        })
        app.use((req, res, next) => {
          passport.authenticate('basic', (err, user, info) => {
            if (err) return next(err)
            if (!user) return next()
            req.user = user
            next()
          })(req, res, next)
        })
        app.use(middleware.swaggerSecurity({
          userAccessToken: (req, def, scopes, callback) => {
            if (req.user) return callback()
            const error = new Error('Invalid credentials')
            error.status = 403
            return callback(error)
          }
        }))
        app.use(middleware.swaggerValidator({validateResponse: true}))
        app.use(middleware.swaggerRouter({controllers: path.join(__dirname, '..', 'api', 'controllers')}))
        app.use(middleware.swaggerUi())
        app.use('/api', (err, req, res, next) => {
          res.statusCode = res.statusCode && res.statusCode < 300 ? err.status || 500 : res.statusCode
          if (config.get('logging.error.enabled') && res.statusCode === 500) logError(err)
          res.json({message: err.message})
        })
        resolve(app)
      }))
  })
}
module.exports = setup
