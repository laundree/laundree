/**
 * Created by budde on 13/05/16.
 */

var identicon = require('identicon')
var express = require('express')

var router = express.Router()

router.get('/:id/:size.png', (req, res, next) => {
  var size = parseInt(req.params.size)
  if (isNaN(size) || size <= 0) {
    var error = new Error('Image not found')
    error.status = 404
    return next(error)
  }
  identicon.generate({id: req.params.id, size: size}, (err, buffer) => {
    if (err) return next(err)
    res.set('Content-Type', 'image/png')
    res.send(buffer)
  })
})

module.exports = router
