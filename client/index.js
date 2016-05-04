/**
 * Created by budde on 12/04/16.
 */

var io = require('socket.io-client')

var socket = io('/')

console.log('┬┴┬┴┤ ͜ʖ ͡°) ├┬┴┬┴')

var id = Math.ceil(Math.random() * 10000)

socket.on('message', function (data) {
  console.log('Message from ' + data.id + (data.id === id ? ' (you)' : '') + ': ' + data.message)
})

module.exports.message = function (message) {
  socket.emit('message', {id: id, message: message})
}

var initializers = require('./initializers')

var library = new initializers.InitializerLibrary()
library.registerInitializer(initializers.SignUpInitializer)
library.registerInitializer(initializers.SignInInitializer)
library.registerInitializer(initializers.DropDownInitializer)

library.setup()
