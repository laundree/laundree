const React = require('react')
const DocumentTitle = require('react-document-title')

class AdminPanel extends React.Component {

  componentDidMount () {
    this.context.actions.updateStats()
  }

  renderStats () {
    const {realLaundryCount, realUserCount, demoUserCount, demoLaundryCount, machineCount, bookingCount} = this.stats
    return <ul className={this.props.stats ? '' : 'loading'}>
      <li>
        <span className='value'>{realUserCount}</span>
        <span className='label'>Users</span>
      </li>
      <li>
        <span className='value'>{demoUserCount}</span>
        <span className='label'>Demo users</span>
      </li>
      <li>
        <span className='value'>{realLaundryCount}</span>
        <span className='label'>Laundries</span>
      </li>
      <li>
        <span className='value'>{demoLaundryCount}</span>
        <span className='label'>Demo laundries</span>
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
    if (!this.props.stats) return {}
    const {laundryCount, demoLaundryCount, userCount, demoUserCount} = this.props.stats
    return Object.assign({
      realLaundryCount: laundryCount - demoLaundryCount,
      realUserCount: userCount - demoUserCount
    }, this.props.stats)
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
