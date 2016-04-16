var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', (req, res) => {
  res.render('promo', {
    title: [],
    no_nav: true,
    styles: ['/stylesheets/promo.css']
  })
})

module.exports = router
