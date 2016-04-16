var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', (req, res) => {
  res.render('home', {title: ['Home'], styles: ['/stylesheets/home.css']})
})

module.exports = router
