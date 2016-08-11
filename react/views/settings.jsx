const React = require('react')
const DocumentTitle = require('react-document-title')
const {ValidationElement, ValidationForm} = require('./validation')
class Settings extends React.Component {

  get laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  render () {
    return <DocumentTitle title='Settings'>
      <main className='naved' id='LaundryMain'>
        <h1>Laundry settings</h1>
        <ValidationForm id='LaundrySettingsForm'>
          <div>
            <ValidationElement value='' nonEmpty>
              <label data-default-label='Name' className='has_label' data-validate-error='A laundry must have a name'>
                <input type='text' defaultValue={this.laundry.name}/>
              </label>
            </ValidationElement>
          </div>
          <div className='buttons'>
            <input type='submit' value='Change'/>
          </div>
        </ValidationForm>
      </main>
    </DocumentTitle>
  }
}

Settings.propTypes = {
  currentLaundry: React.PropTypes.string,
  laundries: React.PropTypes.object,
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    photo: React.PropTypes.string
  })
}

module.exports = Settings
