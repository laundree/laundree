// @flow
import express from 'express'
import type {Request} from '../types'
import { createInvitePdf } from '../../utils/pdf'
const router = express.Router()

router.get('/invitation/:laundryId/:code.pdf', async (req: Request, res, next) => {
  const result = await createInvitePdf(req.params.laundryId, req.params.code, req.locale || 'en')
  res.set('Content-Type', 'application/pdf')
  result.pipe(res)
})

export default router
