const React = require('react')
const Loader = require('./loader.jsx')
const sdk = require('../../client/sdk')

const UserLoader = ({userId, children}) => <Loader loader={() => sdk.fetchUser(userId)}>{children}</Loader>

UserLoader.propTypes = {
  children: React.PropTypes.any,
  userId: React.PropTypes.string.isRequired
}

module.exports = UserLoader
