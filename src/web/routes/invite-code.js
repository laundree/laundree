// @flow
import express from 'express'
import base64UrlSafe from 'urlsafe-base64'
import * as error from '../../utils/error'
import type { Request } from '../types'
import sdk from '../sdk'

const router = express.Router()

const notFoundError = new error.StatusError('Not found', 404)

router.get('/:laundryId/:id', async (req: Request, res, next) => {
  const {id, laundryId} = req.params
  if (!base64UrlSafe.validate(id) || !base64UrlSafe.validate(laundryId)) {
    return next(notFoundError)
  }
  const user = req.user
  if (!user) return res.redirect(`/auth?to=${encodeURIComponent(req.originalUrl)}`)
  if (user.demo) {
    return next(notFoundError)
  }
  try {
    const laundry = await sdk.api.laundry.get(laundryId)
    await sdk.api.laundry.verifyInviteCode(laundry.id, {key: id})
    await sdk.api.laundry.addUser(laundry.id, user.id)
    res.redirect(`/laundries/${laundry.model.id}`)
  } catch (err) {
    next(err)
  }
})

export default router
