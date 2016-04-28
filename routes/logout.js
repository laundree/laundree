/**
 * Created by budde on 27/04/16.
 */

var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
  req.logout()
  res.redirect('/')
})

module.exports = router
