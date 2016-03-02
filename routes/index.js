var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', {title: ['Home'], styles: ['/stylesheets/index.css']})
})

module.exports = router
