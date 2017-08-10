import express from 'express'
import webApp from './web/app'
import apiAppPromise from './api/app'
import webpack from './webpack'

if (['development', 'test'].indexOf(process.env.NODE_ENV) >= 0) {
  process.emitWarning('Server started on non development nor test environment')
}

const app = express()

export default apiAppPromise.then(a => {
  app.use('/', webpack)
  app.use('/api', a)
  app.use('/', webApp)
  return app
})
