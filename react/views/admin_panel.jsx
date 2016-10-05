const React = require('react')
const DocumentTitle = require('react-document-title')

class AdminPanel extends React.Component {

  componentDidMount () {
    this.context.actions.updateStats()
  }

  renderStats () {
    const {laundryCount, userCount, machineCount, bookingCount} = this.stats

    return <ul className={this.props.stats ? '' : 'loading'}>
      <li>
        <span className='value'>{userCount}</span>
        <span className='label'>Users</span>
      </li>
      <li>
        <span className='value'>{laundryCount}</span>
        <span className='label'>Laundries</span>
      </li>
      <li>
        <span className='value'>{machineCount}</span>
        <span className='label'>Machines</span>
      </li>
      <li>
        <span className='value'>{bookingCount}</span>
        <span className='label'>Bookings</span>
      </li>
    </ul>
  }

  get stats () {
    return this.props.stats || {}
  }

  render () {
    return <DocumentTitle title='Administrator panel'>
      <main id='AdminPanel' className='topNaved'>
        <h1>Admin Panel</h1>
        <section id='Stats'>
          {this.renderStats()}
        </section>
      </main>
    </DocumentTitle>
  }
}

AdminPanel.contextTypes = {
  actions: React.PropTypes.shape({
    updateStats: React.PropTypes.func
  })
}

AdminPanel.propTypes = {
  stats: React.PropTypes.object
}

module.exports = AdminPanel
