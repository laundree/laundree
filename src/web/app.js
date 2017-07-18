// @flow
import { opbeat, trackRelease } from '../opbeat'
import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import flash from 'connect-flash'
import morganSetup from './morgan'
import * as error from '../utils/error'
import locale from 'locale'
import { toLocale, supported } from '../locales/index'
import config from 'config'
import compression from 'compression'
import Debug from 'debug'
import sessionSetup from './session'
import handlebarsSetup from './handlebars'
import type { Response, Request, Application } from './types'
import setupSass from 'node-sass-middleware'
import identicon from './identicon'
import reactRouter from './routes/react'

const debug = Debug('laundree.app')

const app: Application = express()
app.use(compression())

// SETUP FLASH
app.use(flash())

// SETUP MORGAN
morganSetup(app)

// SETUP STATIC + PSEUDO-STATIC ROUTES
app.use('/identicon', identicon)
app.use(setupSass({
  src: path.join(__dirname, '..', '..', 'stylesheets'),
  dest: path.join(__dirname, '..', '..', 'dist', 'stylesheets'),
  prefix: '/stylesheets',
  outputStyle: config.get('sass.outputStyle'),
  indentedSyntax: true,
  sourceMap: true
}))
app.use(express.static(path.join(__dirname, '..', '..', 'public')))
app.use(express.static(path.join(__dirname, '..', '..', 'dist')))
app.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain')
  const sitemapUrl = `${config.get('web.protocol')}://${config.get('web.host')}/sitemap.txt`
  res.send(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}`)
})
// SETUP SESSION
app.use(sessionSetup)

// SETUP LOCALE
app.use(locale(supported))
app.use((req: Request, res: Response, next) => {
  let locale =req.session.locale || req.locale
  locale = toLocale(locale, 'en')
  req.locale = locale
  res.set('Content-Language', locale)
  next()
})

// SETUP HANDLEBARS
handlebarsSetup(app).then(() => debug('Partials is setup'), error.logError)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use('/identicon', identicon)
app.use(setupSass({
  src: path.join(__dirname, '..', '..', 'stylesheets'),
  dest: path.join(__dirname, '..', '..', 'dist', 'stylesheets'),
  prefix: '/stylesheets',
  outputStyle: config.get('sass.outputStyle'),
  indentedSyntax: true,
  sourceMap: true
}))
app.use('/', reactRouter)
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

export default app
