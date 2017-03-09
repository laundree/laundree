const React = require('react')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const {DocumentTitle, Modal, Label, Input, Submit} = require('./intl')
const {FormattedMessage} = require('react-intl')
const sdk = require('../../client/sdk')
const Loader = require('./Loader')
const {DropDown, DropDownTitle, DropDownContent, DropDownCloser} = require('./dropdown')
const {Link} = require('react-router')
const {createInvitePdf} = require('../../utils/pdf')
const request = require('superagent')
const toBuffer = require('blob-to-buffer')

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
    this.state = {}
  }
  generatePdf () {
    if (this.state.generating) return
    this.setState({generating: true})
    Promise
      .all([sdk.laundry(this.props.laundry.id).createInviteCode(), this.fetchLogo()])
      .then(([{key}, logoBuffer]) => this.generatePdfBuffer(logoBuffer, key))
      .then(buffer => this.setState({pdf: buffer, generating: false}))
  }
  generatePdfBuffer (logoBuffer, code) {
    return new Promise((resolve, reject) => {
      const stream = createInvitePdf(
        logoBuffer,
        this.props.laundry.id,
        code,
        this.props.locale)
      const buffers = []
      stream.on('data', d => buffers.push(d))
      stream.on('end', () => resolve(Buffer.concat(buffers)))
      stream.on('error', reject)
    })
  }
  fetchLogo () {
    return request
      .get('/images/logo.png')
      .responseType('blob')
      .then(({body}) => new Promise((resolve, reject) => toBuffer(body, (err, buffer) => {
        if (err) return reject(err)
        resolve(buffer)
      })))
  }
  generateLink () {
    if (!this.state.pdf) {
      return <button
        className={'pdfLink' + (this.state.generating ? 'inactive' : '')}
        onClick={() => this.generatePdf()}>
            {this.state.generating
              ? <FormattedMessage id='general.generating'/>
              : <FormattedMessage id='users.qr-signup.generate-code'/> }
              </button>
    }
    return <a
      className='button red qr-download'
      href={`data:application/pdf;base64,${this.state.pdf.toString('base64')}`} target='_blank'>
        <svg>
          <use xlinkHref='#MediaDownload' />
        </svg>
        <FormattedMessage id='users.qr-signup.download'/>
      </a>
  }
  render () {
    return <div id='QrSignUp'>
      <FormattedMessage
        id='users.qr-signup.message'
        values={{
          nl: <br />
        }}/>
      <div className={'linkContainer buttonContainer' + (this.state.generating ? ' generating' : '')}>
        {this.generateLink()}
      </div>
    </div>
  }
}

QrInvite.propTypes = {
  laundry: React.PropTypes.object.isRequired,
  locale: React.PropTypes.string.isRequired
}

class LinkElement extends React.Component {
  render () {
    return <div className='link'>{this.props.link}</div>
  }
}

LinkElement.propTypes = {
  link: React.PropTypes.string.isRequired
}

class LinkInvite extends React.Component {
  constructor (props) {
    super(props)
    this.state = {link: null}
  }

  generateLink () {
    if (this.state.generating) return
    this.setState({generating: true})
    sdk.laundry(this.props.laundry.id)
      .createInviteCode()
      .then(({href}) => this.setState({link: href, generating: false}))
  }

  renderLink () {
    if (this.state.link) {
      return <LinkElement link={this.state.link}/>
    }
    return <button onClick={() => this.generateLink()} className={this.state.generating ? 'inactive' : ''}>
      {this.state.generating
        ? <FormattedMessage id='general.generating'/>
        : <FormattedMessage id='users.invite-form-link.button'/> }
    </button>
  }

  render () {
    return <div id='UserLinkSignUp'>
      <FormattedMessage id='users.invite-form-link.text' values={{
        nl: <br />
      }}/>
      <div className={'linkContainer buttonContainer ' + (this.state.generating ? 'generating' : '')}>
        {this.renderLink()}
      </div>
    </div>
  }
}

LinkInvite.propTypes = {
  laundry: React.PropTypes.shape({
    id: React.PropTypes.string,
    owners: React.PropTypes.array
  }).isRequired
}

class UserItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {showModal: false}
    this.onShowModal = () => this.setState({showModal: true})
    this.onCloseModal = () => this.setState({showModal: false})
    this.handleDelete = () => sdk.laundry(this.props.laundry.id).removeUserFromLaundry(this.props.user.id)
  }

  makeOwner () {
    sdk.laundry(this.props.laundry.id).addOwner(this.props.user.id)
  }

  makeUser () {
    sdk.laundry(this.props.laundry.id).removeOwner(this.props.user.id)
  }

  get isCurrentUser () {
    return this.props.user.id === this.props.currentUser.id
  }

  renderRole () {
    const isOwner = this.isOwner
    if (this.isCurrentUser || (isOwner && this.props.laundry.owners.length === 1)) {
      return <span className='owner'><FormattedMessage id='users.owner'/></span>
    }
    return <DropDown>
      <DropDownTitle>
          <span className='owner'>
            <FormattedMessage id={isOwner ? 'users.owner' : 'users.user'}/>
          </span>
      </DropDownTitle>
      <DropDownContent>
        <ul className='dropDownList'>
          <DropDownCloser>
            <li className={isOwner ? 'active' : ''} onClick={() => this.makeOwner()}>
              <span className='link'><FormattedMessage id='users.owner'/></span>
            </li>
          </DropDownCloser>
          <DropDownCloser>
            <li className={isOwner ? '' : 'active'} onClick={() => this.makeUser()}>
              <span className='link'><FormattedMessage id='users.user'/></span>
            </li>
          </DropDownCloser>
        </ul>
      </DropDownContent>
    </DropDown>
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

  renderName () {
    if (!this.addUserLink) return this.props.user.displayName
    return <Link to={`/users/${this.props.user.id}/settings`}>
      {this.props.user.displayName}
    </Link>
  }

  renderAvatar () {
    const avatarImage = <img className='avatar' src={this.props.user.photo}/>
    if (!this.addUserLink) return avatarImage
    return <Link to={`/users/${this.props.user.id}/settings`}>
      {avatarImage}
    </Link>
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
        {this.renderAvatar()}
      </div>
      <div className='name'>
        {this.renderName()}
        {this.renderDelete()}
        {this.renderRole()}
      </div>
    </div>
  }

  get addUserLink () {
    return this.props.user.id === this.props.currentUser.id || this.props.currentUser.role === 'admin'
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
  }).isRequired,
  currentUser: React.PropTypes.object.isRequired
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
      {this.users.map(user => <li key={user.id}><UserItem
        user={user}
        currentUser={this.currentUser}
        laundry={this.props.laundry}/></li>)}
      {this.invites.map(invite => <li key={invite.id}><InviteItem invite={invite}/></li>)}
    </ul>
  }

  load () {
    return sdk.listUsersAndInvites(this.props.laundry.id)
  }

  get users () {
    return this.props.laundry.users.map(id => this.props.users[id]).filter(u => u)
  }

  get invites () {
    return this.props.laundry.invites.map((id) => this.props.invites[id]).filter((i) => i).filter(({used}) => !used)
  }

  get currentUser () {
    return this.props.users[this.props.currentUser]
  }

  render () {
    return <DocumentTitle title='document-title.laundry-users'>
      <Loader loader={() => this.load()}>
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
            <QrInvite laundry={this.props.laundry} locale={this.props.locale}/>
          </section>
          <section id='LinkInviteSection'>
            <FormattedMessage id='users.invite-from-link' tagName='h2'/>
            <LinkInvite laundry={this.props.laundry}/>
          </section>
        </main>
      </Loader>
    </DocumentTitle>
  }
}

Users.propTypes = {
  locale: React.PropTypes.string.isRequired,
  invites: React.PropTypes.object,
  users: React.PropTypes.object,
  laundry: React.PropTypes.object,
  currentUser: React.PropTypes.string.isRequired
}

module.exports = Users
