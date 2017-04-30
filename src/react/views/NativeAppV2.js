/**
 * Created by budde on 26/02/2017.
 */

const React = require('react')
const sdk = require('../../client/sdk')
const uuid = require('uuid')

class NativeApp extends React.Component {
  componentDidMount () {
    if (!this.props.currentUser) {
      return
    }
    this.setupToken()
  }

  async setupToken () {
    const {secret, owner} = await sdk.token.createToken(`app-${uuid.v4()}`)
    window.location = `laundree://auth/${owner.id}/${secret}`
  }

  render () {
    return null
  }
}

NativeApp.propTypes = {
  currentUser: React.PropTypes.string,
  users: React.PropTypes.object
}

module.exports = NativeApp
