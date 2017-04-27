const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', (req, res) => {
  res.render('promo', {
    title: [],
    no_nav: true,
    styles: ['/stylesheets/promo.css']
  })
})

module.exports = router
