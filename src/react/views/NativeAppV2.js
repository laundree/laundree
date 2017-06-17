// @flow

import React from 'react'
import sdk from '../../client/sdk'
import uuid from 'uuid'
import type {User} from 'laundree-sdk/lib/redux'

export default class NativeApp extends React.Component {
  props: {currentUser: string, users: {[string]: User}}
  componentDidMount () {
    if (!this.props.currentUser) {
      return
    }
    this.setupToken()
  }

  async setupToken () {
    const {secret, owner} = await sdk.api.token.createToken(`app-${uuid.v4()}`)
    window.location = `laundree://auth/${owner.id}/${secret}`
  }

  render () {
    return null
  }
}
