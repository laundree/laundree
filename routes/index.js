/**
 * Created by budde on 16/04/16.
 */

var express = require('express')
var router = express.Router()

router.use('/app', (req, res, next) => {
  if (req.user) return next()
  res.redirect('/auth')
}, require('./home'))

router.use('/sign-up', require('./sign-up'))
router.use('/logout', require('./logout'))
router.use('/about', require('./about'))
router.use('/javascripts', require('./javascripts'))

var authMiddleware = (req, res, next) => {
  if (!req.user) return next()
  res.redirect('/app')
}

router.use('/', authMiddleware, require('./home'))
router.use('/auth', authMiddleware, require('./auth'))

module.exports = router
