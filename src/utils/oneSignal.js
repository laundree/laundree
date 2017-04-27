/**
 * Created by budde on 17/04/2017.
 */
const config = require('config')
const request = require('superagent')
const url = 'https://onesignal.com/api/v1/notifications'
const {appId, templateId, restApiKey, enabled} = config.get('oneSignal')
const debug = require('debug')('laundree.utils.oneSignal')

async function createNotification (playerIds, sendAfter) {
  debug('Trying to setup notification for players', playerIds, 'sending after', sendAfter)
  if (!enabled) {
    debug('One signal is not enabled. Skipping notification setup')
  }
  const {body: {id}} = await request
    .post(url)
    .set('Authorization', `Basic ${restApiKey}`)
    .set('Content-Type', 'application/json')
    .send({
      app_id: appId,
      template_id: templateId,
      include_player_ids: playerIds,
      send_after: sendAfter.toISOString()
    })
  debug('Got id', id)
  return id
}

function deleteNotification (id) {
  debug('Trying to delete notification with id', id)
  if (!enabled) {
    debug('One signal is not enabled. Skipping notification deletion')
  }
  return request
    .delete(`${url}/${id}`)
    .query({app_id: appId})
    .set('Authorization', `Basic ${restApiKey}`)
    .set('Content-Type', 'application/json')
}

module.exports = {
  createNotification,
  deleteNotification
}
