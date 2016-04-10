var express = require('express')
var router = express.Router()

router.get('/', (req, res) => {
  res.render('book', {title: ['Book'], styles: ['/stylesheets/book.css'], compact_top: true})
})

module.exports = router
