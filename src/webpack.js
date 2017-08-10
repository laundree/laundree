import express from 'express'
import conf from '../webpack.dev'

const router = express.Router()

if (process.env.NODE_ENV === 'development') {
  process.emitWarning('Starting webpack dev server')
  const webpackMiddleware = require('webpack-dev-middleware')
  const webpack = require('webpack')
  router.use(webpackMiddleware(webpack(conf), {
    publicPath: '/javascripts/'
  }))
}

export default router
