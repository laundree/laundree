// @flow
import React from 'react'
import sdk from '../../client/sdk'
import uuid from 'uuid'
import type { User, State } from 'laundree-sdk/lib/redux'
import { connect } from 'react-redux'

type NativeAppProps = { currentUser: ?string, users: { [string]: User } }

class NativeApp extends React.Component<NativeAppProps> {
  _token: ?Promise<{}>

  async promisedToken () {
    if (this._token) return this._token
    if (!this.props.currentUser) {
      this._token = Promise.resolve({})
    } else {
      this._token = sdk.api.user.createToken(this.props.currentUser, {name: `app-${uuid.v4()}`, type: 'auth'})
        .then(({secret, owner}) => ({secret, userId: owner.id}))
        .catch(err => ({message: err}))
    }
    return this._token
  }

  componentDidMount () {
    const f: Function = (event: MessageEvent) => {
      switch (event.data) {
        case 'token':
          this
            .promisedToken()
            .then(token => window.postMessage(JSON.stringify(token)))
      }
    }
    document.addEventListener('message', f, false)
  }

  render () {
    return <div />
  }
}

export default connect(({users, currentUser}: State): NativeAppProps => ({
  currentUser, users
}))(NativeApp)
