/**
 * Created by budde on 13/05/16.
 */

const jdenticon = require('jdenticon')
const express = require('express')
const router = express.Router()
const {string: {hash}} = require('../utils')

router.get('/:id/:size.svg', (req, res, next) => {
  var size = parseInt(req.params.size)
  if (isNaN(size) || size <= 0) {
    var error = new Error('Image not found')
    error.status = 404
    return next(error)
  }
  res.set('Content-Type', 'image/svg+xml')
  const id = /^[0-9a-f]{11,}$/.exec(req.params.id) ? req.params.id : hash(req.params.id)
  var svg = jdenticon.toSvg(id, size)
  res.send(svg)
})

module.exports = router
