/**
 * Created by budde on 13/05/16.
 */

const jdenticon = require('jdenticon')
const express = require('express')
const router = express.Router()

router.get('/:id/:size.svg', (req, res, next) => {
  var size = parseInt(req.params.size)
  if (isNaN(size) || size <= 0) {
    var error = new Error('Image not found')
    error.status = 404
    return next(error)
  }
  res.set('Content-Type', 'image/svg+xml')
  var svg = jdenticon.toSvg(req.params.id, size)
  res.send(svg)
})

module.exports = router
