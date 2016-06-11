const socketIo = require('socket.io')
const redis = require('socket.io-redis')
const session = require('./session')
const config = require('config')
const {UserHandler} = require('../handlers')
const {createInitialStore} = require('../redux')

/**
 * Set up the socket with provided namespaces.
 * @param {Agent} server
 */
function setupSocket (server) {
  const io = socketIo(server)
  io.adapter(redis({host: config.get('redis.host'), port: config.get('redis.port')}))
  io.use((socket, next) => session(socket.request, socket.request.res, next))
  setupRedux(io.of('/redux'))
}

function setupRedux (io) {
  io.on('connect', (s) => {
    var currentUserId = s.request.session.passport.user
    UserHandler.findFromId(currentUserId).then((user) => {
      createInitialStore(user).then((store) => s.emit('init', store.getState()))
    })
  })
}

module.exports = setupSocket
