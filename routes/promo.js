var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', (req, res) => {
  res.render('promo', {
    title: ['Laundree.io'],
    no_top: true,
    no_footer: true,
    styles: ['/stylesheets/promo.css']
  })
})

module.exports = router
