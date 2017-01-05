const React = require('react')
const Loader = require('./loader.jsx')
const sdk = require('../../client/sdk')

const UserLoader = ({userId, children, users}) => <Loader
  loader={() => users[userId] || sdk.fetchUser(userId)}>{children}</Loader>

UserLoader.propTypes = {
  children: React.PropTypes.any,
  users: React.PropTypes.object.isRequired,
  userId: React.PropTypes.string.isRequired
}

module.exports = UserLoader
