// @flow
import config from 'config'
import request from 'superagent'
import Debug from 'debug'

const url = 'https://onesignal.com/api/v1/notifications'
const {appId, templateId, restApiKey, enabled} = config.get('oneSignal')
const debug = Debug('laundree.utils.oneSignal')

export async function createNotification (playerIds: string[], sendAfter: Date) {
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

export function deleteNotification (id: string) {
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
