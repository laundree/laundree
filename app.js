require('babel-register')
const {opbeat, trackRelease} = require('./lib/opbeat')

const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const {fetchRoutes} = require('./routes')
const setups = require('./lib')
const config = require('config')
const app = express()
const hbs = require('hbs')
const {error} = require('./utils')

hbs.registerPartials(path.join(__dirname, 'views', 'partials'))
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

// Session
app.use(setups.sessionSetup)

// Passport
setups.passportSetup(app)
setups.morganSetup(app)
setups.defaultUserSetup()

app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'stylesheets'),
  dest: path.join(__dirname, 'dist/stylesheets'),
  prefix: '/stylesheets',
  outputStyle: config.get('sass.outputStyle'),
  indentedSyntax: true,
  sourceMap: true
}))

// Routes
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'dist')))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(flash())

// Swagger
module.exports = {
  app,
  promise: fetchRoutes().then((routes) => {
    app.use('/', routes)
    app.get('/err', (req, res, next) => {
      next(new Error('This is a test error'))
    })

    app.use(function (req, res, next) {
      const error = new Error('Not found')
      error.status = 404
      next(error)
    })
    app.use((err, req, res, next) => {
      const status = err.status || 500
      switch (status) {
        case 404:
          res.status(404)
          res.render('error-404',
            {
              title: ['Page not found'],
              styles: ['/stylesheets/error.css']
            })
          break
        default:
          next(err)
      }
    })

    if (opbeat) app.use(opbeat.middleware.express())

    app.use((err, req, res, next) => {
      const status = err.status || 500
      res.status(status)
      error.logError(err)
      res.render('error-500', {
        message: err.message,
        styles: ['/stylesheets/error.css']
      })
    })
    trackRelease()
    return app
  })
}
