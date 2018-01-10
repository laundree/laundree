// @flow
import React from 'react'
import type { User } from 'laundree-sdk/lib/redux'
import { connect } from 'react-redux'
import { signUpStore } from '../client/store'
import { shortIdToLong } from '../utils/string'
import sdk from '../client/sdk'
import Debug from 'debug'
import ReactGA from 'react-ga'

const debug = Debug('laundree.react.LaundryAdder')

class LaundryAdder extends React.Component<{ user: ?User }, { signUp?: { userId: string, laundryId: string, key: string } }> {
  state = {}

  async componentDidMount () {
    const signUp = signUpStore.get()
    if (!signUp) {
      return
    }
    const user = this.props.user
    if (!user) {
      return
    }
    if (signUp.userId !== user.id) {
      return
    }
    signUpStore.del()
    const longId = shortIdToLong(signUp.laundryId)
    if (user.laundries.indexOf(longId) >= 0) {
      return
    }
    try {
      await sdk.api.laundry.addFromCode(longId, {key: signUp.key})
      ReactGA.event({category: 'User', action: 'Add laundry from code'})
      debug('Added laundry!')
    } catch (err) {
      debug('Failed to add user to laundry... ', err)
    }
  }

  render () {
    return null
  }
}

export default connect(({users, currentUser}): { user: ?User } => ({user: (currentUser && users[currentUser]) || null}))(LaundryAdder)
