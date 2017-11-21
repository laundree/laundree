// @flow
import express from 'express'
import passport from 'passport'
import Debug from 'debug'
import { INVALID_VERIFICATION_LINK, EMAIL_VERIFIED } from '../../utils/flash'
import type { Request, Response, Router } from '../types'
import sdk from './../sdk'

const router: Router = express.Router()
const debug = Debug('laundree.routes.auth')

router.get('/verify', async (req: Request, res) => {
  const user = req.query.user
  const token = req.query.token
  const email = req.query.email
  const locale = req.locale || 'en'
  if (!user || !token || !email) {
    req.flash('error', INVALID_VERIFICATION_LINK)
    return res.redirect(`/${locale}/auth/`)
  }
  try {
    await sdk.api.user.verifyEmail(user, {email, token})
  } catch (err) {
    req.flash('error', INVALID_VERIFICATION_LINK)
    return res.redirect(`/${locale}/auth/`)
  }
  req.flash('success', EMAIL_VERIFIED)
  return res.redirect(`/${locale}/auth/`)
})

function findRedirect (req: Request): { to?: string, errorTo?: string } {
  const {mode, key, laundryId} = req.query
  switch (mode) {
    case 'native-app':
      return {to: `/${req.locale || 'en'}/native-app`, errorTo: `/${req.locale || 'en'}/native-app`}
    case 'native-app-v2':
      return {to: `/${req.locale || 'en'}/native-app-v2`, errorTo: `/${req.locale || 'en'}/native-app-v2`}
    case 'laundry':
      if (!key || !laundryId) {
        return {}
      }
      return ({to: `/s/${encodeURIComponent(laundryId)}/${encodeURIComponent(key)}`, errorTo: `/${req.locale || 'en'}/laundries/${encodeURIComponent(laundryId)}/${encodeURIComponent(key)}`})
    default:
      return {}
  }
}

function saveTo (f: (req: Request, res: Response) => void): (req: Request, res: Response) => void {
  return function (req) {
    const {to, errorTo} = findRedirect(req)
    debug('Saving to: ', to)
    req.session.to = to
    req.session.errorTo = errorTo
    return f.apply(null, arguments)
  }
}

function setupCallback (router, strategy) {
  router.get(`/${strategy}/callback`,
    function (req: Request) {
      debug('Got state', req.query.state)
      passport.authenticate(strategy, {failureRedirect: req.session.errorTo || `${req.baseUrl}?${strategy}_auth_failure=1`}).apply(null, arguments)
    },
    (req: Request, res) => res.redirect(req.session.to || '/'))
}

router.get('/facebook', saveTo(function (req: Request, res) {
  const params: { scope: string[], state: string, authType?: string } = {
    scope: ['public_profile', 'email'],
    state: 'test'
  }
  if (req.query.rerequest) params.authType = 'rerequest'
  passport.authenticate('facebook', params).apply(null, arguments)
}))

setupCallback(router, 'facebook')

router.get('/google', saveTo(passport.authenticate('google', {
  accessType: 'online',
  scope: ['openid', 'profile', 'email'],
  state: 'test'
})))

setupCallback(router, 'google')

router.post('/local', function (req: Request) {
  passport.authenticate('local', {
    failureRedirect: `/${req.locale || 'en'}/auth`,
    successRedirect: findRedirect(req).to || '/',
    failureFlash: true
  }).apply(null, arguments)
})

export default router
