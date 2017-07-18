// @flow
import express from 'express'
import base64UrlSafe from 'urlsafe-base64'
import LaundryHandler from '../../handlers/laundry'
import * as error from '../../utils/error'
import type UserHandler from '../../handlers/user'
import type {Request} from '../types'

const router = express.Router()

const notFoundError = new error.StatusError('Not found', 404)

router.get('/:laundryId/:id', (req: Request, res, next) => {
  const {id, laundryId} = req.params
  if (!base64UrlSafe.validate(id) || !base64UrlSafe.validate(laundryId)) {
    return next(notFoundError)
  }
  const user: ?UserHandler = req.user
  if (!user) return res.redirect(`/auth?to=${encodeURIComponent(req.originalUrl)}`)
  if (user.isDemo()) {
    return next(notFoundError)
  }
  LaundryHandler
    .lib
    .findFromShortId(laundryId)
    .then(laundry => {
      if (!laundry) {
        throw notFoundError
      }
      return laundry
        .verifyInviteCode(id)
        .then(result => {
          if (!result) throw new Error('Invalid key')
          return laundry.addUser(req.user)
        })
        .then(() => res.redirect(`/laundries/${laundry.model.id}`))
    })
    .catch(next)
})

export default router
