// @flow

import React from 'react'
import sdk from '../../client/sdk'
import uuid from 'uuid'
import type {User} from 'laundree-sdk/lib/redux'

export default class NativeApp extends React.Component<{currentUser: string, users: {[string]: User}}> {

  componentDidMount () {
    if (!this.props.currentUser) {
      return
    }
    this.setupToken()
  }

  async setupToken () {
    const {secret, owner} = await sdk.api.user.createToken(this.props.currentUser, {name: `app-${uuid.v4()}`, type: 'auth'})
    window.location = `laundree://auth/${owner.id}/${secret}`
  }

  render () {
    return null
  }
}
