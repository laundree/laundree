/**
 * Created by budde on 16/04/16.
 */

const express = require('express')
const router = express.Router()

function fetchRoutes () {
  router.use('/logout', require('./logout'))
  router.use('/javascripts', require('./javascripts'))
  router.use('/identicon', require('./identicon'))
  router.use('/auth', require('./auth'))
  router.use('/pdf', require('./pdf'))
  router.use('/s', require('./invite-code'))
  router.use('/', require('./app.jsx'))
  return require('./swagger').fetchRouter().then(route => {
    router.use('/api', route)
    return router
  })
}

module.exports = {fetchRoutes}
