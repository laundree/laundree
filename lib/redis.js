/**
 * Created by budde on 23/06/16.
 */

const redis = require('redis')
const config = require('config')
const createClient = () => redis.createClient({host: config.get('redis.host'), port: config.get('redis.port')})
const pubClient = createClient()
const subClient = createClient()
/**
 * Will link provided EventEmitter to redis.
 * @param {EventEmitter} subEmitter
 * @param {EventEmitter} pubEmitter
 * @param {string} name
 * @param {string[]} listen Events to listen on
 * @param {function (Object) : Promise.<string> } serialize
 * @param {function (string) : Promise.<Object>} deserialize
 */
function linkEmitter (subEmitter, pubEmitter, name, listen, serialize, deserialize) {
  const channelName = `eventEmitter@${name + listen.join('+')}`
  subClient.on('message', (channel, message) => {
    if (channelName !== channel) return
    const parsedMessage = JSON.parse(message)
    deserialize(parsedMessage.message).then((obj) => pubEmitter.emit(parsedMessage.event, obj))
  })
  subClient.subscribe(channelName)
  listen.forEach((event) => subEmitter
    .on(event, (obj) => {
      serialize(obj).then((str) =>
        pubClient.publish(channelName, JSON.stringify({
          event: event,
          message: str
        })))
    }))
}

module.exports = {linkEmitter}
