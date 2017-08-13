import {startServer} from './utils/server'
import apiAppPromise from './app'
import setupSocket from './websocket/socket_io'
import http from 'http'

apiAppPromise.then(app => {
  const server = http.createServer(app)
  startServer(server)
  setupSocket(server)
})
