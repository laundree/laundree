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
      return this.context.actions
        .inviteUserByEmail(this.props.laundryId, this.state.values.email)
        .then(() => this.reset())
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

InviteUserForm.contextTypes = {
  actions: React.PropTypes.shape({
    inviteUserByEmail: React.PropTypes.func
  })
}

InviteUserForm.propTypes = {
  laundryId: React.PropTypes.string.isRequired
}

class Users extends React.Component {

  renderUser (user) {
    return <div>
      <div className='avatarContainer'>
        <img className='avatar' src={user.photo}/>
        </div>
      <div className='name'>
        {user.displayName}{' '}{this.isOwner(user.id) ? <span className='owner'>Owner</span> : ''}
      </div>
    </div>
  }

  renderInvite (invite) {
    return <div>
      <div className='avatar'/>
      <div className='name'>
        {invite.email}
      </div>
    </div>
  }

  isOwner (user) {
    return this.props.laundry.owners.indexOf(user) >= 0
  }

  renderUsers () {
    return <ul>
      {this.users.map((user) => <li key={user.id}>{this.renderUser(user)}</li>)}
      {this.invites.map((invite) => <li key={invite.id}>{this.renderInvite(invite)}</li>)}
    </ul>
  }

  get users () {
    return this.props.laundry.users.map((id) => this.props.users[id]).filter((u) => u)
  }

  get invites () {
    return this.props.laundry.invites.map((id) => this.props.invites[id]).filter((i) => i).filter(({used}) => !used)
  }

  render () {
    return <DocumentTitle title='Laundry users'>
      <main className='naved'>
        <h1 className='alignLeft'>Laundry users</h1>
        <section id='UserList'>
          {this.renderUsers()}
        </section>
        <section id='InviteUserForm'>
          <h2>Invite user</h2>
          <InviteUserForm laundryId={this.props.laundry.id}/>
        </section>
      </main>
    </DocumentTitle>
  }
}

Users.propTypes = {
  invites: React.PropTypes.object,
  users: React.PropTypes.object,
  laundry: React.PropTypes.object
}

module.exports = Users
