// @flow
import express from 'express'
import { supported } from '../../locales/index'
import { logError } from '../../utils/error'
import type { Request } from '../types'
import sdk from './../sdk'

const router = express.Router()

supported.forEach(locale => {
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
})
export default router
