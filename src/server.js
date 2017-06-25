// @flow

import {promise} from './app'
import Debug from 'debug'
import http from 'http'
import config from 'config'
import socketIoSetup from './lib/socket_io'

const debug = Debug('laundree.server')
const port = normalizePort(config.get('web.port'))

export default promise.then((app) => {
  /**
   * Get port from environment and store in Express.
   */

  app.set('port', port)

  /**
   * Create HTTP server.
   */
  const server = http.createServer(app)
  return () => {
    server.listen(port)
    server.on('error', onError)
    server.on('listening', () => onListening(server))
    socketIoSetup(server)
    return server
  }
})

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort (val) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port.toString()

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening (server) {
  const addr = server.address()
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  debug('Listening on ' + bind)
}
