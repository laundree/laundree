var express = require('express')
var router = express.Router()

/* GET users listing. */
router.get('/', (req, res) => {
  res.render('sign-in', {title: ['Sign-in'], no_nav: true, styles: ['/stylesheets/sign-in.css']})
})

module.exports = router
