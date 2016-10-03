const React = require('react')
const DocumentTitle = require('react-document-title')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const Modal = require('./modal.jsx')

class InviteUserForm extends ValueUpdater {
  constructor (props) {
    super(props)
    this.submitHandler = (evt) => {
      evt.preventDefault()
      return this.context.actions
        .inviteUserByEmail(this.props.laundry.id, this.state.values.email)
        .then(() => this.reset())
    }
  }

  render () {
    return <ValidationForm
      sesh={this.state.sesh}
      onSubmit={this.submitHandler}>
      <div
        data-demo-message="You can't add users to a demo laundry"
        className={this.props.laundry.demo ? 'demo' : ''}>
        <div>
          <ValidationElement
            sesh={this.state.sesh}
            initial={this.state.values.email === undefined}
            value={this.state.values.email || ''} email trim>
            <label
              data-validate-error='Please enter a valid email address'>
              <input
                placeholder='Email address'
                type='text' onChange={this.generateValueUpdater('email')}
                value={this.state.values.email || ''}/>
            </label>
          </ValidationElement>
        </div>
        <div className='buttons'>
          <input type='submit' value='Invite'/>
        </div>
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
  laundry: React.PropTypes.object.isRequired
}

class UserItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {showModal: false}
    this.onShowModal = () => this.setState({showModal: true})
    this.onCloseModal = () => this.setState({showModal: false})
    this.handleDelete = () => this.context.actions.removeUserFromLaundry(this.props.laundry.id, this.props.user.id)
  }

  renderOwner () {
    if (!this.isOwner) return null
    return <span className='owner'>Owner</span>
  }

  renderDelete () {
    if (this.isOwner) return null
    return <div className='delete action'>
      <svg onClick={this.onShowModal}>
        <use xlinkHref='#Trash'/>
      </svg>
    </div>
  }

  get isOwner () {
    return this.props.laundry.owners.indexOf(this.props.user.id) >= 0
  }

  render () {
    return <div>
      <Modal
        show={this.state.showModal}
        onClose={this.onCloseModal}
        message='Are you absolutely sure that you want to delete this user?'
        actions={[
          {label: 'Yes', className: 'delete red', action: this.handleDelete},
          {label: 'No', action: this.onCloseModal}
        ]}/>
      <div className='avatarContainer'>
        <img className='avatar' src={this.props.user.photo}/>
      </div>
      <div className='name'>
        {this.props.user.displayName}
        {this.renderOwner()}
        {this.renderDelete()}
      </div>
    </div>
  }
}

UserItem.propTypes = {
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    photo: React.PropTypes.string,
    displayName: React.PropTypes.string
  }).isRequired,
  laundry: React.PropTypes.shape({
    id: React.PropTypes.string,
    owners: React.PropTypes.array
  }).isRequired
}
UserItem.contextTypes = {
  actions: React.PropTypes.shape({
    removeUserFromLaundry: React.PropTypes.func
  })
}

class InviteItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {showModal: false}
    this.onShowModal = () => this.setState({showModal: true})
    this.onCloseModal = () => this.setState({showModal: false})
    this.handleDelete = () => this.context.actions.deleteInvite(this.props.invite.id)
  }

  render () {
    return <div>
      <Modal
        show={this.state.showModal}
        onClose={this.onCloseModal}
        message='Are you absolutely sure that you want to delete this invitation?'
        actions={[
          {label: 'Yes', className: 'delete red', action: this.handleDelete},
          {label: 'No', action: this.onCloseModal}
        ]}/>
      <div className='avatarContainer'/>
      <div className='name'>
        {this.props.invite.email}
        <div className='delete action'>
          <svg onClick={this.onShowModal}>
            <use xlinkHref='#Trash'/>
          </svg>
        </div>
      </div>
    </div>
  }
}

InviteItem.propTypes = {
  invite: React.PropTypes.shape({
    id: React.PropTypes.string,
    email: React.PropTypes.string
  }).isRequired
}

InviteItem.contextTypes = {
  actions: React.PropTypes.shape({
    deleteInvite: React.PropTypes.func
  })
}

class Users extends React.Component {

  renderUsers () {
    return <ul>
      {this.users.map((user) => <li key={user.id}><UserItem user={user} laundry={this.props.laundry}/></li>)}
      {this.invites.map(invite => <li key={invite.id}><InviteItem invite={invite}/></li>)}
    </ul>
  }

  componentDidMount () {
    this.context.actions.listUsersAndInvites(this.props.laundry.id)
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
          <InviteUserForm laundry={this.props.laundry}/>
        </section>
      </main>
    </DocumentTitle>
  }
}

Users.contextTypes = {
  actions: React.PropTypes.shape({
    listUsersAndInvites: React.PropTypes.func
  })
}

Users.propTypes = {
  invites: React.PropTypes.object,
  users: React.PropTypes.object,
  laundry: React.PropTypes.object
}

module.exports = Users
