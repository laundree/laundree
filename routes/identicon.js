/**
 * Created by budde on 13/05/16.
 */

var jdenticon = require('jdenticon')
var express = require('express')
var crypto = require('crypto')
var router = express.Router()

router.get('/:id/:size.svg', (req, res, next) => {
  var size = parseInt(req.params.size)
  if (isNaN(size) || size <= 0) {
    var error = new Error('Image not found')
    error.status = 404
    return next(error)
  }
  res.set('Content-Type', 'image/svg+xml')
  var hash = crypto.createHash('md5').update(req.params.id).digest('hex')
  var svg = jdenticon.toSvg(hash, size)
  res.send(svg)
})

module.exports = router
