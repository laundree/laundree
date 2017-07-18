// @flow
import { createStore } from 'redux'
import { redux } from 'laundree-sdk'
import type UserHandler from '../handlers/user'
import type { Flash, Action, ListLaundriesAction } from 'laundree-sdk/lib/redux'

function mapFlash (flashArray, type) {
  return flashArray
    .map((message: string) => ({type: type, message: message}))
    .map((flash: Flash) => ({type: 'FLASH', payload: flash}))
}

async function fetchLaundries (currentUser) : Promise<ListLaundriesAction> {
  const laundries = await currentUser.fetchLaundries()
  return {type: 'LIST_LAUNDRIES', payload: laundries.map(l => l.reduxModel())}
}

/**
 * Create initial store
 * @param {UserHandler} currentUser
 * @param {Array=} successFlash
 * @param {Array=} errorFlash
 * @param {string=} locale
 * @param {string=} googleApiKey
 * @param {boolean=} returningUser
 * @return {Promise}
 */
export function createInitialEvents (currentUser: ?UserHandler, successFlash: string[] = [], errorFlash: string[] = [], locale: string = 'en', googleApiKey: string = '', returningUser: boolean = false) {
  let events: Action[] = mapFlash(successFlash, 'success')
  events = events.concat(mapFlash(errorFlash, 'error'))
  events.push({type: 'CONFIGURE', payload: {locale, googleApiKey, returningUser}})
  if (!currentUser) return Promise.resolve(events)
  const signInAction: Action = {type: 'SIGN_IN_USER', payload: currentUser.reduxModel()}
  events.push(signInAction)
  return fetchLaundries(currentUser).then((event: Action) => events.concat(event))
}

export function createInitialStore (currentUser: ?UserHandler, successFlash: string[] = [], errorFlash: string[] = [], locale: string = 'en', googleApiKey: string = '', returningUser: boolean = false) {
  return createInitialEvents(currentUser, successFlash, errorFlash, locale, googleApiKey, returningUser)
    .then((events) => {
      const store = createStore(redux.reducer)
      events.forEach((event) => store.dispatch(event))
      return store
    })
}
