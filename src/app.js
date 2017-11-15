import express from 'express'
import webApp from './web/app'
import apiAppPromise from './api/app'

const app = express()

export default apiAppPromise.then(a => {
  app.use('/api', a)
  app.use('/', webApp)
  return app
})
