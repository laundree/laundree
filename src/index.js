import {startServer} from './utils/server'
import apiAppPromise from './app'
import setupSocket from './websocket/socket_io'
import http from 'http'

if (process.env.NODE_ENV !== 'development') {
  process.emitWarning('Server started on non development environment')
}

apiAppPromise.then(app => {
  const server = http.createServer(app)
  startServer(server)
  setupSocket(server)
})
