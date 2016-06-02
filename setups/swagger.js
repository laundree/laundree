/**
 * Created by budde on 05/05/16.
 */
var path = require('path')
var YAML = require('yamljs')
var swaggerTools = require('swagger-tools')
var config = require('config')
var passport = require('passport')

function setup (app) {
  return new Promise((resolve, reject) => {
    YAML.load(path.join(__dirname, '..', 'api', 'swagger', 'swagger.yaml'),
      (result) => swaggerTools.initializeMiddleware(result, (middleware) => {
        app.use(middleware.swaggerMetadata())
        app.use(middleware.swaggerSecurity({
          userAccessToken: (req, def, scopes, callback) => {
            if (req.user) return callback()
            passport.authenticate('basic', (err, user, info) => {
              if (err) return callback(err)
              if (!user) {
                var error = new Error('Invalid credentials')
                error.status = 403
                return callback(error)
              }
              req.user = user
              return callback()
            })(req, null, callback)
          }
        }))
        app.use(middleware.swaggerValidator({validateResponse: true}))
        app.use(middleware.swaggerRouter({controllers: path.join(__dirname, '..', 'api', 'controllers')}))
        app.use(middleware.swaggerUi())
        app.use('/api', (err, req, res, next) => {
          res.statusCode = res.statusCode || err.status || 500
          if (config.get('logging.error.enabled') && res.statusCode === 500) console.log(err)
          res.json({message: err.message})
        })
        resolve(app)
      }))
  })
}
module.exports = setup
