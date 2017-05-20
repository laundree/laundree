import {opbeat, trackRelease} from './lib/opbeat'
import connectMongoose from './lib/mongoose'
import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import flash from 'connect-flash'
import {fetchRoutes, fetchPseudoStaticRoutes} from './routes'
import morganSetup from './lib/morgan'
import {error} from './utils'
import locale from 'locale'
import locales from './locales'
import config from 'config'
import compression from 'compression'
import Debug from 'debug'
import sessionSetup from './lib/session'
import passportSetup from './lib/passport'
import defaultUserSetup from './lib/default_users'
import handlebarsSetup from './lib/handlebars'
const debug = Debug('laundree.app')
connectMongoose()

const app = express()
app.use(compression())

// SETUP MORGAN
morganSetup(app)

// SETUP STATIC + PSEUDO-STATIC ROUTES
app.use(fetchPseudoStaticRoutes())
app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(express.static(path.join(__dirname, '..', 'dist')))
app.get('/robots.txt', function (req, res) {
  res.type('text/plain')
  const sitemapUrl = `${config.get('web.protocol')}://${config.get('web.host')}/sitemap.txt`
  res.send(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}`)
})
// SETUP SESSION
app.use(sessionSetup)

// SETUP PASSPORT
passportSetup(app)

// SETUP LOCALE
app.use(locale(locales.supported))
app.use((req, res, next) => {
  let locale = (req.user && req.user.model.locale) || req.session.locale || req.locale
  if (locales.supported.indexOf(locale) < 0) {
    locale = 'en'
  }
  req.locale = locale
  res.set('Content-Language', locale)
  next()
})

// SETUP DEFAULT USERS
defaultUserSetup()

// SETUP HANDLEBARS
handlebarsSetup(app).then(() => debug('Partials is setup'), error.logError)

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
