// @flow
import { startServer } from '../utils/server'
import appPromise from './app'
import http from 'http'

appPromise.then((app) => {
  const server = http.createServer(app)
  startServer(server)
})

