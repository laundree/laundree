/**
 * Created by budde on 16/04/16.
 */

const express = require('express')
const path = require('path')
const config = require('config')
const setupSass = require('node-sass-middleware')
const cors = require('cors')
function fetchPseudoStaticRoutes () {
  const router = express.Router()
  router.use('/javascripts', require('./javascripts'))
  router.use('/identicon', require('./identicon'))
  router.use(setupSass({
    src: path.join(__dirname, '..', 'stylesheets'),
    dest: path.join(__dirname, '..', 'dist', 'stylesheets'),
    prefix: '/stylesheets',
    outputStyle: config.get('sass.outputStyle'),
    indentedSyntax: true,
    sourceMap: true
  }))
  return router
}

function fetchRoutes () {
  const router = express.Router()
  router.use('/logout', require('./logout'))
  router.use('/auth', require('./auth'))
  router.use('/calendar', require('./calendar'))
  router.use('/s', require('./invite-code'))
  router.use('/', require('./app'))
  router.use('/lang', require('./lang'))
  return require('./swagger').fetchRouter().then(route => {
    router.use('/api', cors(), route)
    return router
  })
}

module.exports = {fetchPseudoStaticRoutes, fetchRoutes}
