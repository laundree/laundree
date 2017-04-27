const React = require('react')
const Loader = require('./Loader')
const sdk = require('../../client/sdk')

function hasLaundries (laundries, user) {
  return user.laundries.every(id => laundries[id])
}

const UserLoader = ({userId, children, users, laundries}) => {
  const user = users[userId]
  return <Loader
    loader={() => sdk.fetchUser(userId)}
    loaded={user && hasLaundries(laundries, user)}>{children}</Loader>
}
UserLoader.propTypes = {
  children: React.PropTypes.any,
  users: React.PropTypes.object.isRequired,
  laundries: React.PropTypes.object.isRequired,
  userId: React.PropTypes.string.isRequired
}

module.exports = UserLoader
