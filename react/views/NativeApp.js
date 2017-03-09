/**
 * Created by budde on 26/02/2017.
 */

const React = require('react')
const sdk = require('../../client/sdk')
const uuid = require('uuid')

class NativeApp extends React.Component {
  constructor (props) {
    super(props)
    this.state = {now: null, data: null}
  }

  get promisedToken () {
    if (this._token) return this._token
    if (!this.props.currentUser) {
      this._token = Promise.resolve({})
    } else {
      this._token = sdk.token.createToken(`app-${uuid.v4()}`)
        .then(({secret, owner}) => ({secret, userId: owner.id}))
        .catch(err => ({message: err}))
    }
    return this._token
  }

  componentDidMount () {
    document.addEventListener('message', event => {
      switch (event.data) {
        case 'token':
          this
            .promisedToken
            .then(token => window.postMessage(JSON.stringify(token)))
      }
    }, false)
  }

  render () {
    return <div>
      <div>
        {this.state.now}
      </div>
      <div>
        {this.state.data}
      </div>
    </div>
  }
}

NativeApp.propTypes = {
  currentUser: React.PropTypes.string,
  users: React.PropTypes.object
}

module.exports = NativeApp
