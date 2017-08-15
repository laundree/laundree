// @flow
import { createStore } from 'redux'
import { redux } from 'laundree-sdk'
import type { User, Laundry } from 'laundree-sdk/lib/sdk'
import type {
  User as ReduxUser,
  Laundry as ReduxLaundry,
  Flash,
  Action,
  ListLaundriesAction
} from 'laundree-sdk/lib/redux'
import sdk from './sdk'
import config from 'config'

function mapFlash (flashArray, type) {
  return flashArray
    .map((message: string) => ({type: type, message: message}))
    .map((flash: Flash) => ({type: 'FLASH', payload: flash}))
}

async function fetchLaundries (currentUser: User): Promise<ListLaundriesAction> {
  const laundries = await Promise.all(currentUser.laundries.map(({id}) => sdk.api.laundry.get(id)))
  const reduxLaundries = laundries.map(laundryToReduxLaundry)
  return {type: 'LIST_LAUNDRIES', payload: reduxLaundries}
}

function laundryToReduxLaundry (laundry: Laundry): ReduxLaundry {
  return {
    id: laundry.id,
    name: laundry.name,
    machines: laundry.machines.map(({id}) => id),
    users: laundry.users.map(({id}) => id),
    owners: laundry.owners.map(({id}) => id),
    invites: laundry.invites.map(({id}) => id),
    timezone: laundry.timezone,
    googlePlaceId: laundry.googlePlaceId,
    demo: laundry.demo,
    rules: laundry.rules
  }
}

function userToReduxUser (user: User): ReduxUser {
  return {
    id: user.id,
    photo: user.photo,
    displayName: user.displayName,
    laundries: user.laundries.map(({id}) => id),
    role: user.role,
    lastSeen: user.lastSeen || undefined,
    demo: Boolean(user.demo)
  }
}

/**
 * Create initial store
 */
export async function createInitialEvents (currentUser: ?User, successFlash: string[] = [], errorFlash: string[] = [], locale: string = 'en', token: string = '') {
  let events: Action[] = mapFlash(successFlash, 'success')
  events = events.concat(mapFlash(errorFlash, 'error'))
  events.push({
    type: 'CONFIGURE',
    payload: {
      locale,
      googleApiKey: config.get('google.clientApiKey'),
      apiBase: config.get('api.base'),
      socketIoBase: config.get('socket_io.base'),
      token
    }
  })
  if (!currentUser) return events
  const signInAction: Action = {type: 'SIGN_IN_USER', payload: userToReduxUser(currentUser)}
  events.push(signInAction)
  const event = await fetchLaundries(currentUser)
  return events.concat(event)
}

export function createInitialStore (currentUser: ?User, successFlash: string[] = [], errorFlash: string[] = [], locale: string = 'en', token: string = '') {
  return createInitialEvents(currentUser, successFlash, errorFlash, locale, token)
    .then((events) => {
      const store = createStore(redux.reducer)
      events.forEach((event) => store.dispatch(event))
      return store
    })
}
