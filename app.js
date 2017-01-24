require('babel-register')
const {opbeat, trackRelease} = require('./lib/opbeat')

const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const {fetchRoutes, fetchPseudoStaticRoutes} = require('./routes')
const setups = require('./lib')
const app = express()
const {error} = require('./utils')
const locale = require('locale')
const locales = require('./locales')
const debug = require('debug')('laundree.app')

// SETUP MORGAN
setups.morganSetup(app)

// SETUP STATIC + PSEUDO-STATIC ROUTES
app.use(fetchPseudoStaticRoutes())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'dist')))

// SETUP SESSION
app.use(setups.sessionSetup)

// SETUP PASSPORT
setups.passportSetup(app)

// SETUP LOCALE
app.use(locale(locales.supported))
app.use((req, res, next) => {
  let locale = (req.user && req.user.model.locale) || req.session.locale || req.locale
  if (locales.supported.indexOf(locale) < 0) {
    locale = 'en'
  }
  req.locale = locale
  next()
})

// SETUP DEFAULT USERS
setups.defaultUserSetup()

// SETUP HANDLEBARS
setups.handlebarsSetup(app).then(() => debug('Partials is setup'), error.logError)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(flash())

module.exports = {
  app,
  promise: fetchRoutes().then(routes => {
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
          res.renderHb('error-404.hbs', {
            intlTitle: 'document-title.not-found', styles: ['/stylesheets/error.css']
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
      res.renderHb('error-500.hbs', {
        message: err.message,
        intlTitle: 'document-title.internal-error',
        styles: ['/stylesheets/error.css']
      })
    })
    trackRelease()
    return app
  })
}
