/**
 * Created by budde on 27/04/16.
 */

const express = require('express')
const router = express.Router()

router.get('/', function (req, res) {
  req.logout()
  res.redirect('/')
})

module.exports = router
