var express = require('express')
var router = express.Router()

/* GET users listing. */
router.get('/', (req, res) => {
  res.render('sign-up', {title: ['Sign-up'], no_header: true, styles: ['/stylesheets/sign-up.css']})
})

module.exports = router
