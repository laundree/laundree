// @flow
import express from 'express'
import { logError } from '../../utils/error'
import type { Request } from '../types'
import sdk from './../sdk'
import type { LocaleType } from '../../locales/index'

export default (locale: LocaleType) => {
  const router = express.Router()

  router.get(`/${locale}`, (req: Request, res, next) => {
    req.session.locale = locale
    req.locale = locale
    res.set('Content-Language', locale)
    const user = req.user
    if (user) {
      sdk.api.user.updateUser(user.id, {locale: locale}).catch(logError)
    }
    next()
  })
  return router
}

