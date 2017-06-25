// @flow
import express from 'express'
import type {Request} from '../types'
const router = express.Router()

/* GET home page. */
router.get('/', (req: Request, res) => {
  res.render('promo', {
    title: [],
    no_nav: true,
    styles: ['/stylesheets/promo.css']
  })
})

export default router
