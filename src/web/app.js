// @flow
import { opbeat, trackRelease } from '../opbeat'
import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import flash from 'connect-flash'
import morganSetup from '../morgan'
import * as error from '../utils/error'
import locale from 'locale'
import { supported, toLocale } from '../locales/index'
import config from 'config'
import compression from 'compression'
import Debug from 'debug'
import sessionSetup from './session'
import passportSetup from './passport'
import handlebarsSetup from './handlebars'
import type { Response, Request, WebApp } from './types'
import setupSass from 'node-sass-middleware'
import identicon from './routes/identicon'
import pdf from './routes/pdf'
import reactRouter from './routes/react'
import authRoute from './routes/auth'
import inviteCodeRoute from './routes/invite-code'
import langRoute from './routes/lang'
import { signUserToken, verifyExpiration } from '../auth'
import helmet from 'helmet'
import logoutRoute from './routes/logoutRoute'
import seo from './routes/seo'

const debug = Debug('laundree.app')

const app: WebApp = express()
app.set('trust proxy', 1)
app.use(compression())
app.use(helmet())
// SETUP FLASH
app.use(flash())
// SETUP MORGAN
morganSetup(app)

// SETUP STATIC + PSEUDO-STATIC ROUTES
app.use('/identicon', identicon)
app.use('/pdf', pdf)
app.use(seo)
app.use(setupSass({
  src: path.join(__dirname, '..', '..', 'stylesheets'),
  dest: path.join(__dirname, '..', '..', 'dist', 'stylesheets'),
  prefix: '/stylesheets',
  outputStyle: config.get('sass.outputStyle'),
  indentedSyntax: true,
  sourceMap: true,
  force: process.env.NODE_ENV === 'development'
}))
app.use(express.static(path.join(__dirname, '..', '..', 'public')))
app.use(express.static(path.join(__dirname, '..', '..', 'dist')))

app.use(setupSass({
  src: path.join(__dirname, '..', '..', 'stylesheets'),
  dest: path.join(__dirname, '..', '..', 'dist', 'stylesheets'),
  prefix: '/stylesheets',
  outputStyle: config.get('sass.outputStyle'),
  indentedSyntax: true,
  sourceMap: true
}))

// SETUP SESSION
app.use(sessionSetup)

// SETUP PASSPORT
passportSetup(app)

// SETUP LOCALE
app.use(locale(supported))
app.use((req: Request, res, next) => {
  req.locale = toLocale(req.locale, 'en')
  next()
})
app.use(async (req: Request, res: Response, next) => {
  if (!req.user) {
    return next()
  }
  const id = req.user.id
  debug('Checking token')
  if (req.session.token && verifyExpiration(req.session.token, 60 * 60)) {
    debug('Token is still fresh AF')
    return next()
  }
  debug('Renewing token')
  req.session.token = await signUserToken(id, 'https://web.laundree.io', ['https://api.laundree.io', 'https://socket.laundree.io'], Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60)
  next()
})

// SETUP HANDLEBARS
handlebarsSetup(app).then(() => debug('Partials is setup'), error.logError)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use('/auth', authRoute)
app.use('/logout', logoutRoute)
app.use('/s', inviteCodeRoute)
supported.forEach(locale => {
  const router = express.Router()
  router.use('/', langRoute(locale))
  router.use('/s', inviteCodeRoute)
  router.use('/', reactRouter(locale))
  app.use(`/${locale}`, router)
})

app.get('/err', (req: Request, res, next) => {
  next(new Error('This is a test error'))
})

app.get('/', (req: Request, res) => res.redirect(`/${req.locale || 'en'}`))

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
