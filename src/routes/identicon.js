// @flow
import jdenticon from 'jdenticon'
import express from 'express'
import { hash } from '../utils/string'
import { StatusError } from '../utils/error'
import type {Request} from '../types'
const router = express.Router()

router.get('/:id/:size.svg', (req: Request, res, next) => {
  const size = parseInt(req.params.size)
  if (isNaN(size) || size <= 0) {
    next(new StatusError('Image not found', 404))
  }
  res.set('Content-Type', 'image/svg+xml')
  const id = /^[0-9a-f]{11,}$/.exec(req.params.id) ? req.params.id : hash(req.params.id)
  const svg = jdenticon.toSvg(id, size)
  res.send(svg)
})

export default router
