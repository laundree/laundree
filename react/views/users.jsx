const React = require('react')
const DocumentTitle = require('react-document-title')

class Users extends React.Component {

  renderUser (user) {
    return <div>
      <img className='avatar' src={user.photo}/>
      <div className='name'>
        {user.displayName}
      </div>
    </div>
  }

  isOwner (user) {
    return this.props.laundry.owners.find((id) => id === user.id)
  }

  renderUsers () {
    return <ul>{this.users.map((user) => <li key={user.id}>{this.renderUser(user)}</li>)}</ul>
  }

  get users () {
    return this.props.laundry.users.map((id) => this.props.users[id]).filter((u) => u)
  }

  render () {
    return <DocumentTitle title='Bookings'>
      <main className='naved'>
        <h1 className='alignLeft'>Laundry users</h1>
        <section id='UserList'>
          {this.renderUsers()}
        </section>
      </main>
    </DocumentTitle>
  }
}

Users.propTypes = {
  users: React.PropTypes.object,
  laundry: React.PropTypes.object
}

module.exports = Users
