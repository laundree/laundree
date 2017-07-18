import express from 'express'
import webpackMiddleware from 'webpack-dev-middleware'
import webpack from 'webpack'
import conf from '../webpack.dev'

const router = express.Router()

router.use(webpackMiddleware(webpack(conf), {
  publicPath: '/javascripts/'
}))

export default router
