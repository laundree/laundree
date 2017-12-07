// @flow

import React from 'react'
import sdk from '../client/sdk'
import uuid from 'uuid'
import type { User, State } from 'laundree-sdk/lib/redux'
import { connect } from 'react-redux'

type NativeAppProps = { currentUser: ?string, users: { [string]: User } }

class NativeApp extends React.Component<NativeAppProps> {

  componentDidMount () {
    if (!this.props.currentUser) {
      return
    }
    this.setupToken()
  }

  async setupToken () {
    if (!this.props.currentUser) {
      return
    }
    const {secret, owner} = await sdk.api.user.createToken(this.props.currentUser, {
      name: `app-${uuid.v4()}`,
      type: 'auth'
    })
    window.location = `laundree://auth/${owner.id}/${secret}`
  }

  render () {
    return null
  }
}

export default connect(({users, currentUser}: State): NativeAppProps => ({
  currentUser, users
}))(NativeApp)
