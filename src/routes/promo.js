// @flow
import express from 'express'
const router = express.Router()
import type {Request} from '../types'

/* GET home page. */
router.get('/', (req: Request, res) => {
  res.render('promo', {
    title: [],
    no_nav: true,
    styles: ['/stylesheets/promo.css']
  })
})

export default router
