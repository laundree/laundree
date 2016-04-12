/**
 * Module dependencies.
 */

var app = require('./app')
var debug = require('debug')('laundree:server')
var http = require('http')
var socketIo = require('socket.io')
var redis = require('socket.io-redis')
/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000')
app.set('port', port)

/**
 * Create HTTP server.
 */
var server = http.createServer(app)

var io = socketIo(server)

if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
  var config = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
  io.adapter(redis(config))
}

/**
 * Listen on provided port, on all network interfaces.
 */
module.exports.start = function () {
  server.listen(port)
  server.on('error', onError)
  server.on('listening', onListening)
  // Socket.io
  io.on('connection', (socket) => {
    socket.on('message', (data) => {
      io.sockets.emit('message', data)
    })
  })
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort (val) {
  var port = parseInt(val, 10)

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

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening () {
  var addr = server.address()
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  debug('Listening on ' + bind)
}
