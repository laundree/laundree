var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', (req, res) => {
  res.render('about', {title: ['About'], styles: ['/stylesheets/about.css'], compact_top: true})
})

module.exports = router
