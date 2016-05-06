/**
 * Created by budde on 05/05/16.
 */
var path = require('path')
var SwaggerExpress = require('swagger-express-mw')
var config = {
  appRoot: path.join(__dirname, '..')
}

function setup (app) {
  return new Promise((resolve, reject) => {
    SwaggerExpress.create(config, (err, swaggerExpress) => {
      if (err) return reject(err)
      swaggerExpress.register(app)
      resolve(app)
    })
  })
}
module.exports = setup
