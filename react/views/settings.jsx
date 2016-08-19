const React = require('react')
const DocumentTitle = require('react-document-title')

class Settings extends React.Component {

  get laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  deleteLaundry () {
    return this.context.actions
      .deleteLaundry(this.props.currentLaundry)
  }

  render () {
    const handleDeleteClick = () => this.deleteLaundry()
    return <DocumentTitle title="Settings">
      <main className="naved" id="LaundryMain">
        <h1>Laundry settings</h1>
        <button onClick={handleDeleteClick}>Delete Laundry</button>
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
Settings.contextTypes = {
  actions: React.PropTypes.shape({
    deleteLaundry: React.PropTypes.func
  })
}

module.exports = Settings
