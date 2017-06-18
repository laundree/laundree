// @flow
import { opbeat, trackRelease } from './lib/opbeat'
import connectMongoose from './lib/mongoose'
import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import flash from 'connect-flash'
import { fetchRoutes, fetchPseudoStaticRoutes } from './routes'
import morganSetup from './lib/morgan'
import * as error from './utils/error'
import locale from 'locale'
import { toLocale, supported } from './locales'
import config from 'config'
import compression from 'compression'
import Debug from 'debug'
import sessionSetup from './lib/session'
import passportSetup from './lib/passport'
import defaultUserSetup from './lib/default_users'
import handlebarsSetup from './lib/handlebars'
import type { Response, Request, Application } from './types'

const debug = Debug('laundree.app')
connectMongoose()

const app: Application = express()
app.use(compression())

// SETUP FLASH
app.use(flash())

// SETUP MORGAN
morganSetup(app)

// SETUP STATIC + PSEUDO-STATIC ROUTES
app.use(fetchPseudoStaticRoutes())
app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(express.static(path.join(__dirname, '..', 'dist')))
app.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain')
  const sitemapUrl = `${config.get('web.protocol')}://${config.get('web.host')}/sitemap.txt`
  res.send(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}`)
})
// SETUP SESSION
app.use(sessionSetup)

// SETUP PASSPORT
passportSetup(app)

// SETUP LOCALE
app.use(locale(supported))
app.use((req: Request, res: Response, next) => {
  let locale = (req.user && req.user.model.locale) || req.session.locale || req.locale
  locale = toLocale(locale, 'en')
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

export default {
  app,
  promise: fetchRoutes().then(routes => {
    app.use('/', routes)
    app.get('/err', (req: Request, res, next) => {
      next(new Error('This is a test error'))
    })

    app.use(function (req: Request, res, next) {
      next(new error.StatusError('Not found', 404))
    })
    app.use((err, req: Request, res, next) => {
      const status = (err && err.status) || 500
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

    app.use((err, req: Request, res, next) => {
      const status = (typeof err.status === 'number' && err.status) || 500
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
