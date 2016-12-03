const React = require('react')
const DocumentTitle = require('react-document-title')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const AdminPanel = require('../containers/admin_panel')
const sdk = require('../../client/sdk')
const {FormattedMessage} = require('react-intl')
const {Input, Label, Submit} = require('./intl')

class CreateLaundry extends ValueUpdater {

  constructor (props) {
    super(props)
    this.state.createExpanded = false
    this.state.loading = false
    this.expander = (evt) => {
      evt.target.blur()
      this.setState(({createExpanded}) => ({createExpanded: !createExpanded}))
    }
    this.onSubmit = (event) => {
      event.preventDefault()
      this.setState({loading: true})
      sdk.laundry
        .createLaundry(this.state.values.name.trim())
        .catch((err) => this.setState({loading: false, notion: CreateLaundry.errorToNotion(err)}))
    }
  }

  componentWillReceiveProps (nextProps) {
    if (!nextProps.user.laundries.length) return
    window.location = `/laundries/${nextProps.user.laundries[0]}/timetable`
  }

  calculateClassName () {
    let className = 'create'
    if (this.state.createExpanded) className += ' expanded'
    if (this.state.notion) className += ' has_notion'
    return className
  }

  static errorToNotion (err) {
    let message
    switch (err.status) {
      case 409:
        message = <FormattedMessage id='home.logged-in.error.duplicate'/>
        break
      case 500:
        message = <FormattedMessage id='home.logged-in.error.duplicate'/>
        break
      default:
        message = <FormattedMessage id='home.logged-in.error.unknown'/>
    }
    return {success: false, message}
  }

  render () {
    return <DocumentTitle title='Create Laundry'>
      <main id='CreateLaundry'>
        <FormattedMessage id='home.logged-in.title' tagName='h1'/>
        <section>
          <FormattedMessage tagName='div' id='home.logged-in.message'/>
          <div className={this.calculateClassName()}>
            <ValidationForm className={this.state.loading ? 'blur' : ''} onSubmit={this.onSubmit}>
              {this.renderNotion()}
              <ValidationElement name='name' nonEmpty value={this.state.values.name || ''}>
                <Label data-validate-error='home.logged-in.error.invalid-laundry-name'>
                  <Input
                    type='text' value={this.state.values.name || ''} onChange={this.generateValueUpdater('name')}
                    placeholder='general.laundry-name'/>
                </Label>
              </ValidationElement>
              <div className='buttons'>
                <Submit value='general.create'/>
              </div>
            </ValidationForm>
            <div className='expand_button'>
              <button onClick={this.expander}>
                <FormattedMessage id='home.logged-in.button.create'/>
              </button>
            </div>
          </div>
          <FormattedMessage tagName='div' id='home.logged-in.message.tenant'/>
        </section>
      </main>
    </DocumentTitle>
  }
}

CreateLaundry.propTypes = {
  user: React.PropTypes.object
}

const CreateLaundryOrAdminPanel = ({user}) => user.role === 'admin' ? <AdminPanel/> : <CreateLaundry user={user}/>

CreateLaundryOrAdminPanel.propTypes = {
  user: React.PropTypes.object
}

module.exports = CreateLaundryOrAdminPanel
