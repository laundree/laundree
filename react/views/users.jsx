const React = require('react')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const {DocumentTitle, Modal, Label, Input, Submit} = require('./intl')
const {FormattedMessage} = require('react-intl')
const sdk = require('../../client/sdk')

class InviteUserForm extends ValueUpdater {
  constructor (props) {
    super(props)
    this.submitHandler = (evt) => {
      evt.preventDefault()
      return sdk.laundry(this.props.laundry.id)
        .inviteUserByEmail(this.state.values.email)
        .then(() => this.reset())
    }
  }

  render () {
    if (this.props.laundry.demo) {
      return <div className='text'>
        <FormattedMessage id='users.invite.demo'/>
      </div>
    }
    return <ValidationForm
      sesh={this.state.sesh}
      onSubmit={this.submitHandler}>
      <div>
        <ValidationElement
          sesh={this.state.sesh}
          initial={this.state.values.email === undefined}
          value={this.state.values.email || ''} email trim>
          <Label
            data-validate-error='users.error.invalid-email'>
            <Input
              placeholder='general.email-address'
              type='text' onChange={this.generateValueUpdater('email')}
              value={this.state.values.email || ''}/>
          </Label>
        </ValidationElement>
      </div>
      <div className='buttons'>
        <Submit value='general.invite'/>
      </div>
    </ValidationForm>
  }
}

InviteUserForm.propTypes = {
  laundry: React.PropTypes.object.isRequired
}

class QrInvite extends React.Component {

  constructor (props) {
    super(props)
    this.onClick = () => this.createPdf()
  }

  createPdf () {
    sdk.laundry(this.props.laundry.id).createInviteCode()
      .then(({pdfHref}) => window.open(pdfHref))
  }

  render () {
    return <div id='QrSignUp'>
      <FormattedMessage
        id='users.qr-signup.message'
        values={{
          nl: <br />,
          link: <span className='pdfLink' onClick={this.onClick}><FormattedMessage
            id='users.qr-signup.message.link'/></span>
        }}/>
    </div>
  }
}

QrInvite.propTypes = {
  laundry: React.PropTypes.object.isRequired
}

class UserItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {showModal: false}
    this.onShowModal = () => this.setState({showModal: true})
    this.onCloseModal = () => this.setState({showModal: false})
    this.handleDelete = () => sdk.laundry(this.props.laundry.id).removeUserFromLaundry(this.props.user.id)
  }

  renderOwner () {
    if (!this.isOwner) return null
    return <span className='owner'>
      <FormattedMessage id='users.owner'/>
    </span>
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
        message='users.modal.delete-user'
        actions={[
          {label: 'general.yes', className: 'delete red', action: this.handleDelete},
          {label: 'general.no', action: this.onCloseModal}
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

class InviteItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {showModal: false}
    this.onShowModal = () => this.setState({showModal: true})
    this.onCloseModal = () => this.setState({showModal: false})
    this.handleDelete = () => sdk.invite(this.props.invite.id).del()
  }

  render () {
    return <div>
      <Modal
        show={this.state.showModal}
        onClose={this.onCloseModal}
        message='users.modal.delete-invite'
        actions={[
          {label: 'general.yes', className: 'delete red', action: this.handleDelete},
          {label: 'general.no', action: this.onCloseModal}
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
    return <ul className='bigList'>
      {this.users.map((user) => <li key={user.id}><UserItem user={user} laundry={this.props.laundry}/></li>)}
      {this.invites.map(invite => <li key={invite.id}><InviteItem invite={invite}/></li>)}
    </ul>
  }

  componentDidMount () {
    sdk.listUsersAndInvites(this.props.laundry.id)
  }

  get users () {
    return this.props.laundry.users.map((id) => this.props.users[id]).filter((u) => u)
  }

  get invites () {
    return this.props.laundry.invites.map((id) => this.props.invites[id]).filter((i) => i).filter(({used}) => !used)
  }

  render () {
    return <DocumentTitle title='document-title.laundry-users'>
      <main className='naved' id='Users'>
        <h1 className='alignLeft'>
          <FormattedMessage id='users.title'/>
        </h1>
        <section id='UserList'>
          {this.renderUsers()}
        </section>
        <section id='InviteUserForm'>
          <FormattedMessage id='users.invite-from-email' tagName='h2'/>
          <InviteUserForm laundry={this.props.laundry}/>
        </section>
        <section id='QrInviteSection'>
          <FormattedMessage id='users.invite-from-qr' tagName='h2'/>
          <QrInvite laundry={this.props.laundry}/>
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
