var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', (req, res) => {
  res.render('promo', {layout: 'no_layout'})
})

module.exports = router
