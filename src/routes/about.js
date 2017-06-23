// @flow

import express from 'express'
import type {Request} from '../types'

const router = express.Router()

/* GET home page. */
router.get('/', (req: Request, res) => {
  res.render('about', {title: ['About'], styles: ['/stylesheets/about.css'], compact_top: true})
})

export default router
