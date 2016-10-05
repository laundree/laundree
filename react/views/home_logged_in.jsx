const React = require('react')
const DocumentTitle = require('react-document-title')
const {ValidationForm, ValidationElement} = require('./validation')
const {ValueUpdater} = require('./helpers')
const AdminPanel = require('../containers/admin_panel')

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
      this.context.actions.createLaundry(this.state.values.name.trim()).then(
        (data) => {
        },
        (err) => this.setState({loading: false, notion: CreateLaundry.errorToNotion(err)}))
    }
  }

  componentWillReceiveProps (nextProps) {
    if (!nextProps.user.laundries.length) return
    this.context.router.replace(`/laundries/${nextProps.user.laundries[0]}/timetable`)
  }

  calculateClassName () {
    var className = 'create'
    if (this.state.createExpanded) className += ' expanded'
    if (this.state.notion) className += ' has_notion'
    return className
  }

  static errorToNotion (err) {
    var message
    switch (err.status) {
      case 409:
        message = 'A laundry by that name already exists'
        break
      case 500:
        message = 'Internal server error'
        break
      default:
        message = 'Unknown error occurred'
    }
    return {type: 'error', message}
  }

  render () {
    return <DocumentTitle title='Create Laundry'>
      <main id='CreateLaundry'>
        <h1>Couldn't find any laundry...</h1>
        <section>
          <div>
            It doesn't seem like you have any laundry attached to your account.
            If you want to share your machines with your tenants, please create a new laundry.
          </div>
          <div className={this.calculateClassName()}>
            <ValidationForm className={this.state.loading ? 'blur' : ''} onSubmit={this.onSubmit}>
              {this.state.notion
                ? <div className={this.state.notion.type + ' notion'}>{this.state.notion.message}</div>
                : null}
              <ValidationElement name='name' nonEmpty value={this.state.values.name || ''}>
                <label data-validate-error='Please enter a name for your laundry.'>
                  <input
                    type='text' value={this.state.values.name || ''} onChange={this.generateValueUpdater('name')}
                    placeholder='Laundry name'/>
                </label>
              </ValidationElement>
              <div className='buttons'>
                <input type='submit' value='Create'/>
              </div>
            </ValidationForm>
            <div className='expand_button'>
              <button onClick={this.expander}>Create a laundry</button>
            </div>
          </div>
          <div>
            Are you a tenant who wants to use laundree for your laundry? Please tell your
            landlord to use Laundree or invite you if he already is.
          </div>
        </section>
      </main>
    </DocumentTitle>
  }
}
CreateLaundry.contextTypes = {
  router: React.PropTypes.object,
  actions: React.PropTypes.shape({
    createLaundry: React.PropTypes.func
  })
}

CreateLaundry.propTypes = {
  user: React.PropTypes.object
}

const CreateLaundryOrAdminPanel = ({user}) => user.role === 'admin' ? <AdminPanel/> : <CreateLaundry user={user}/>

CreateLaundryOrAdminPanel.propTypes = {
  user: React.PropTypes.object
}

module.exports = CreateLaundryOrAdminPanel
