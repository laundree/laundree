const React = require('react')
const DocumentTitle = require('react-document-title')
const {Link} = require('react-router')
const sdk = require('../../client/sdk')

class Stats extends React.Component {

  componentDidMount () {
    sdk.updateStats()
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
    return <section id='Stats'>
      <h2>Current statistics</h2>
      {this.renderStats()}
    </section>
  }
}

Stats.propTypes = {
  stats: React.PropTypes.object
}

class LaundryList extends React.Component {
  componentDidMount () {
    sdk.listLaundries()
  }

  get laundries () {
    return Object.keys(this.props.laundries).map(key => this.props.laundries[key])
  }

  renderLaundryList () {
    return this.laundries.map(l => <li key={l.id}>
      <div className='name'>
        <Link to={`/laundries/${l.id}`}>
          {l.name}
        </Link>
      </div>
    </li>)
  }

  render () {
    return <section id='LaundryList'>
      <h2>Laundries</h2>
      <ul className='bigList'>
        {this.renderLaundryList()}
      </ul>
    </section>
    // TODO handle no laundries
  }
}

LaundryList.propTypes = {
  laundries: React.PropTypes.object
}

class UserList extends React.Component {
  componentDidMount () {
    sdk.listUsers()
  }

  get users () {
    return Object.keys(this.props.users).map(key => this.props.users[key])
  }

  renderUserList () {
    return this.users.map(({id, displayName}) => <li key={id}>
      <span className='name'>{displayName}</span>
    </li>)
  }

  render () {
    return <section id='UserList'>
      <h2>Users</h2>
      <ul className='bigList'>
        {this.renderUserList()}
      </ul>
    </section>
  }
}

UserList.propTypes = {
  users: React.PropTypes.object
}

const AdminPanel = ({stats, laundries, users}) => {
  return <DocumentTitle title='Administrator panel'>
    <main id='AdminPanel' className='topNaved'>
      <h1>Administrator Panel</h1>
      <Stats stats={stats}/>
      <LaundryList laundries={laundries}/>
      <UserList users={users}/>
    </main>
  </DocumentTitle>
}

AdminPanel.propTypes = {
  stats: React.PropTypes.object,
  laundries: React.PropTypes.object,
  users: React.PropTypes.object
}

module.exports = AdminPanel
