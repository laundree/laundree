// @flow
import express from 'express'
import {supported} from '../locales'
import {logError} from '../utils/error'
import type UserHandler from '../handlers/user'
import type {Request} from '../types'

const router = express.Router()

supported.forEach(locale => {
  router.get(`/${locale}`, (req: Request, res) => {
    req.session.locale = locale
    const user: ?UserHandler = req.user
    if (user) {
      user.setLocale(locale).catch(logError)
    }
    res.redirect(req.query.r || '/')
  })
})
export default router

