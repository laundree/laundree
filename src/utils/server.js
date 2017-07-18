// @flow
import Debug from 'debug'
import config from 'config'

const port = config.get('web.port')

const debug = Debug('laundree.server')

export function startServer (server: Server) {
  server.listen(port)
  server.on('error', onError(port))
  server.on('listening', () => onListening(server))
  return server
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError (port) {
  return (error) => {
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
