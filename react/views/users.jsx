const React = require('react')
const DocumentTitle = require('react-document-title')
const {ValidationForm, ValidationElement} = require('./validation')
const {generateChangeHandler} = require('../../utils/react')

class InviteUserForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {values: {}, sesh: 0}
    this.submitHandler = (evt) => {
      evt.preventDefault()
      this.reset()
    }
  }

  reset () {
    this.setState(({sesh}) => ({values: {}, sesh: sesh + 1}))
  }

  render () {
    return <ValidationForm
      sesh={this.state.sesh}
      onSubmit={this.submitHandler}>
      <div>
        <ValidationElement
          sesh={this.state.sesh}
          initial={this.state.values.email === undefined}
          value={this.state.values.email || ''} email trim>
          <label
            data-validate-error='Please enter a valid email address'>
            <input
              placeholder='Email address'
              type='text' onChange={generateChangeHandler(this, 'email')}
              value={this.state.values.email || ''}/>
          </label>
        </ValidationElement>
      </div>
      <div className='buttons'>
        <input type='submit' value='Invite'/>
      </div>
    </ValidationForm>
  }
}

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
        <section id='InviteUserForm'>
          <h2>Invite user</h2>
          <InviteUserForm/>
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
