/**
 * Created by budde on 16/04/16.
 */

var express = require('express')
var router = express.Router()

router.use('/logout', require('./logout'))
router.use('/javascripts', require('./javascripts'))
router.use('/identicon', require('./identicon'))
router.use('/auth', require('./auth'))
router.use('/', require('./app.jsx'))

module.exports = router
