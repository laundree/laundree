// @flow

import redis from 'redis'
import config from 'config'
import EventEmitter from 'events'
const createClient = () => redis.createClient({host: config.get('redis.host'), port: config.get('redis.port')})
const pubClient = createClient()
const subClient = createClient()
subClient.setMaxListeners(100)
/**
 * Will link provided EventEmitter to redis.
 * @param {EventEmitter} subEmitter
 * @param {EventEmitter} pubEmitter
 * @param {string} name
 * @param {string[]} listen Events to listen on
 * @param {function (Object) : Promise.<string> } serialize
 * @param {function (string) : Promise.<Object>} deserialize
 */
function linkEmitter<O, D> (subEmitter: EventEmitter, pubEmitter: EventEmitter, name: string, listen: string[], serialize: (O) => Promise<string>, deserialize: (string) => Promise<D>): void {
  const channelName = `eventEmitter@${name + listen.join('+')}`
  subClient.on('message', async (channel, message) => {
    if (channelName !== channel) return
    const parsedMessage = JSON.parse(message)
    const obj = await deserialize(parsedMessage.message)
    pubEmitter.emit(parsedMessage.event, obj)
  })
  subClient.subscribe(channelName)
  listen.forEach((event) => subEmitter
    .on(event, async (obj) => {
      const str = await serialize(obj)
      pubClient.publish(channelName, JSON.stringify({
        event: event,
        message: str
      }))
    }))
}

module.exports = {linkEmitter}
