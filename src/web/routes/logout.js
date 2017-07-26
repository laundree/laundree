// @flow
import express from 'express'
import type {Request} from '../types'
const router = express.Router()

router.get('/', function (req: Request, res) {
  req.logout()
  req.session.token = undefined
  res.redirect('/')
})

export default router
