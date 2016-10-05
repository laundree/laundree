const React = require('react')
const DocumentTitle = require('react-document-title')
const Modal = require('./modal.jsx')
const {ValueUpdater} = require('./helpers')
const {ValidationForm, ValidationElement} = require('./validation')
const {LaundryClientSdk} = require('../../client/sdk')

class LaundrySettingsForm extends ValueUpdater {

  constructor (props) {
    super(props)
    this.onSubmit = (evt) => {
      evt.preventDefault()
      this.setState({loading: true})
      new LaundryClientSdk(this.props.laundry.id)
        .updateName(this.state.values.name)
        .then(() => this.setState({loading: false, notion: null}))
        .catch(err => this.setState({loading: false, notion: {success: false, message: this.errorToMessage(err)}}))
    }
  }

  errorToMessage ({status, message}) {
    switch (status) {
      case 409:
        return 'A laundry by that name already exists.'
      default:
        return message
    }
  }

  get initialValues () {
    return {
      name: this.props.laundry.name
    }
  }

  componentWillReceiveProps ({laundry}) {
    if (laundry.name === this.props.laundry.name) return
    this.reset({values: {name: laundry.name}})
  }

  generateErrorMessage () {
    return this.state.values.name.trim() ? 'Please enter a new name' : 'Please enter a name'
  }

  render () {
    return <ValidationForm sesh={this.state.sesh} onSubmit={this.onSubmit} className={this.state.loading ? 'blur' : ''}>
      {this.state.notion ? <div
        className={'notion ' + (this.state.notion.success ? 'success' : 'error')}>{this.state.notion.message}</div> : null }
      <ValidationElement
        sesh={this.state.sesh} value={this.state.values.name} notOneOf={['', this.props.laundry.name]}
        trim>
        <label data-validate-error={this.generateErrorMessage()}>
          <input type='text' value={this.state.values.name} onChange={this.generateValueUpdater('name')}/>
        </label>
      </ValidationElement>
      <div className='buttons'>
        <input type='submit' value='Update'/>
      </div>
    </ValidationForm>
  }
}

LaundrySettingsForm.propTypes = {
  laundry: React.PropTypes.object.isRequired
}

class LaundrySettings extends React.Component {

  constructor (props) {
    super(props)
    this.state = {modalOpen: false}
    this.handleDeleteClick = () => this.deleteLaundry()
    this.handleCloseModal = () => this.setState({modalOpen: false})
    this.handleOpenModal = () => this.setState({modalOpen: true})
  }

  get laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  deleteLaundry () {
    return this.context.actions
      .deleteLaundry(this.props.currentLaundry)
  }

  get isOwner () {
    return this.laundry.owners.indexOf(this.props.user.id) >= 0
  }

  renderSettings () {
    if (!this.isOwner) return null
    return <div>
      <section>
        <h2>Change name</h2>
        <LaundrySettingsForm laundry={this.laundry}/>
      </section>
      {this.renderDelete()}
    </div>
  }

  renderDelete () {
    if (this.laundry.demo) return null
    return <section>
      <h2>Delete laundry</h2>
      <Modal
        show={this.state.modalOpen}
        onClose={this.handleCloseModal}
        message='Are you absolutely sure that you want to delete this laundry?'
        actions={[
          {label: 'Yes', className: 'delete red', action: this.handleDeleteClick},
          {label: 'No', action: this.handleCloseModal}
        ]}/>
      <div className='text'>
        Deleting the laundry will remove all data associated with it and remove all users from it.<br />
        It can NOT be undone!
        <div className='buttonContainer'>
          <button onClick={this.handleOpenModal} className='red'>Delete Laundry</button>
        </div>
      </div>
    </section>
  }

  renderApologeticMessage () {
    return <section>
      There's nothing to see here yet!
    </section>
  }

  render () {
    if (!this.laundry) return null
    return <DocumentTitle title='Laundry Settings'>
      <main className='naved' id='LaundrySettings'>
        <h1>Laundry settings</h1>
        {this.isOwner ? this.renderSettings() : this.renderApologeticMessage()}
      </main>
    </DocumentTitle>
  }
}

LaundrySettings.propTypes = {
  currentLaundry: React.PropTypes.string,
  laundries: React.PropTypes.object,
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    photo: React.PropTypes.string
  })
}
LaundrySettings.contextTypes = {
  actions: React.PropTypes.shape({
    deleteLaundry: React.PropTypes.func
  })
}

module.exports = LaundrySettings
