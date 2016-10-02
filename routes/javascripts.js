const browserify = require('browserify')
const babelify = require('babelify')
const express = require('express')
const path = require('path')
const router = express.Router()
const tmp = require('tmp')
const fs = require('fs')

if (process.env.NODE_ENV !== 'production') {
  const bundlePathPromise = new Promise((resolve, reject) => {
    const b = browserify(path.join(__dirname, '../client/index.js'), {
      insertGlobals: true,
      standalone: 'Laundree',
      debug: true,
      transform: [babelify]
    })
    tmp.file((err, path) => {
      if (err) return reject(err)
      const bundleStream = b.bundle()
      bundleStream.pipe(fs.createWriteStream(path))
      bundleStream.on('end', () => resolve(path))
    })
  })
  router.get('/bundle.js', (req, res, next) => {
    bundlePathPromise.then(path => fs.createReadStream(path).pipe(res))
  })
}

module.exports = router
