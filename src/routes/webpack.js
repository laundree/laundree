import express from 'express'

const router = express.Router()

if (process.env.NODE_ENV === 'development') {
  const webpackMiddleware = require('webpack-dev-middleware')
  const webpack = require('webpack')
  const conf = require('../../webpack.dev')

  router.use(webpackMiddleware(webpack(conf), {
    publicPath: '/javascripts/'
  }))
}

export default router
