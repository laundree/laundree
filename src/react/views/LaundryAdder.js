// @flow
import React from 'react'
import type { User } from 'laundree-sdk/lib/redux'
import { connect } from 'react-redux'
import { signUpStore } from '../../client/store'
import { shortIdToLong } from '../../utils/string'
import request from 'superagent'
import Debug from 'debug'

const debug = Debug('laundree.react.views.LaundryAdder')

class LaundryAdder extends React.Component<{ user: ?User }, { signUp?: { userId: string, laundryId: string, key: string } }> {
  state = {}

  componentDidMount () {
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
    if (user.laundries.indexOf(shortIdToLong(signUp.laundryId)) >= 0) {
      return
    }
    request
      .get(`/s/${signUp.laundryId}/${signUp.key}`)
      .catch(err => debug('Got error following invite link', err))
  }

  render () {
    return null
  }
}

export default connect(({users, currentUser}): { user: ?User } => ({user: (currentUser && users[currentUser]) || null}))(LaundryAdder)
