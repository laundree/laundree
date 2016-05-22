/**
 * Created by budde on 16/04/16.
 */

var express = require('express')
var router = express.Router()

router.use('/app', (req, res, next) => {
  if (req.user) return next()
  res.redirect('/auth')
}, require('./app'))

router.use('/sign-up', require('./sign-up'))
router.use('/logout', require('./logout'))
router.use('/about', require('./about'))
router.use('/javascripts', require('./javascripts'))
router.use('/identicon', require('./identicon'))
var authMiddleware = (req, res, next) => {
  if (!req.user) return next()
  res.redirect('/app')
}

router.use('/auth', authMiddleware, require('./auth'))

router.get('/', authMiddleware, (req, res) => res.render('home', {title: ['Home'], styles: ['/stylesheets/home.css']}))

module.exports = router
