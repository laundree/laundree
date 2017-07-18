import express from 'express'
import webApp from './web/app'
import apiAppPromise from './api/app'
import webpack from './webpack'

if (process.env.NODE_ENV !== 'development') {
  process.emitWarning('Server started on non development environment')
}

const app = express()

export default apiAppPromise.then(a => {
  app.use('/', webpack)
  app.use('/api', a)
  app.use('/', webApp)
  return app
})
