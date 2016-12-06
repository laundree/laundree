const React = require('react')
const {DocumentTitle} = require('./intl')
const {Link} = require('react-router')
const sdk = require('../../client/sdk')
const {FormattedMessage} = require('react-intl')

class Stats extends React.Component {

  componentDidMount () {
    sdk.updateStats()
  }

  renderStats () {
    const {realLaundryCount, realUserCount, demoUserCount, demoLaundryCount, machineCount, bookingCount} = this.stats
    return <ul className={this.props.stats ? '' : 'loading'}>
      <li>
        <span className='value'>{realUserCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.users'/>
        </span>
      </li>
      <li>
        <span className='value'>{demoUserCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.demo-users'/>
        </span>
      </li>
      <li>
        <span className='value'>{realLaundryCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.laundries'/>
        </span>
      </li>
      <li>
        <span className='value'>{demoLaundryCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.demo-laundries'/>
        </span>
      </li>
      <li>
        <span className='value'>{machineCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.machines'/>
        </span>
      </li>
      <li>
        <span className='value'>{bookingCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.bookings'/>
        </span>
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
      <FormattedMessage id='admin-panel.stats-title' tagName='h2'/>
      {this.renderStats()}
    </section>
  }
}

Stats.propTypes = {
  stats: React.PropTypes.object
}
class QueryList extends React.Component {
  constructor (props) {
    super(props)
    this.state = {loaded: false, page: 0}
    this.limit = 10
    this.onPrevClick = () => this.prev()
    this.onNextClick = () => this.next()
    this.onFilterUpdate = ({target: {value}}) => this.updateFilter(value)
  }

  updateFilter (q) {
    this.setState({q}, () => this._load())
  }

  componentDidMount () {
    this._load()
  }

  prev () {
    if (this.currentPage === 0) return
    this.setState({page: this.currentPage - 1}, () => this._load())
  }

  next () {
    if (this.currentPage === this.totalPages) return
    this.setState({page: this.currentPage + 1}, () => this._load())
  }

  load (options) {
    throw new Error('Not implemented')
  }

  _load () {
    return this.load({
      q: this.state.q,
      limit: this.limit,
      skip: this.limit * this.currentPage
    }).then(() => this.setState({loaded: true, page: this.currentPage}))
  }

  get elements () {
    throw new Error('Not implemented')
  }

  renderLoading () {
    throw new Error('Not implemented')
  }

  renderEmpty () {
    throw new Error('Not implemented')
  }

  renderElement () {
    throw new Error('Not implemented')
  }

  get currentPage () {
    return Math.max(0, Math.min(this.state.page, this.totalPages))
  }

  get totalPages () {
    return Math.max(0, Math.floor((this.props.total - 1) / this.limit))
  }

  renderList () {
    if (!this.state.loaded) {
      return <div className='bigListMessage'>
        {this.renderLoading()}
      </div>
    }
    return <div>
      <div className='nav'>
        <span className={'prev link' + (this.currentPage === 0 ? ' inactive' : '')} onClick={this.onPrevClick}/>
        <FormattedMessage
          id='admin-panel.page-of'
          values={{
            page: this.currentPage + 1,
            numPages: this.totalPages + 1
          }}
        />
        <span
          className={'next link' + (this.currentPage === this.totalPages ? ' inactive' : '')}
          onClick={this.onNextClick}/>
      </div>
      <div className='filter'>
        <label>
          <input
            type='text' placeholder='Filter' value={this.state.q || ''}
            onChange={this.onFilterUpdate}/>
        </label>
      </div>
      {this.elements.length
        ? <ul className='bigList'>
        { this.elements.map(element => <li key={element.id}>{this.renderElement(element)}</li>)}
      </ul>
        : <div className='bigListMessage'>
        {this.renderEmpty()}
      </div>}
    </div>
  }
}

QueryList.propTypes = {
  total: React.PropTypes.number
}

class LaundryList extends QueryList {

  renderLoading () {
    return <FormattedMessage id='admin-panel.loading'/>
  }

  renderEmpty () {
    return <FormattedMessage id='admin-panel.no-laundries'/>
  }

  get elements () {
    return this.props.laundries
  }

  renderElement (l) {
    return <div className='name'>
      <Link to={`/laundries/${l.id}`}>
        {l.name}
      </Link>
    </div>
  }

  load (options) {
    return sdk.listLaundries(options)
  }

  render () {
    return <section id='LaundryList'>
      <FormattedMessage id='admin-panel.laundries' tagName='h2'/>
      {this.renderList()}
    </section>
  }
}

LaundryList.propTypes = {
  laundries: React.PropTypes.array
}

class UserList extends QueryList {

  load (options) {
    return sdk.listUsers(options)
  }

  renderLoading () {
    return <FormattedMessage id='admin-panel.loading'/>
  }

  renderEmpty () {
    return <FormattedMessage id='admin-panel.no-users'/>
  }

  get elements () {
    return this.props.users
  }

  renderElement ({id, photo, displayName}) {
    return <div className='name'>
      <Link to={`/users/${id}`}>
        <img src={photo} className='avatar'/>
        {displayName}
      </Link>
    </div>
  }

  render () {
    return <section id='UserList'>
      <FormattedMessage id='admin-panel.users' tagName='h2'/>
      {this.renderList()}
    </section>
  }
}

UserList.propTypes = {
  users: React.PropTypes.array
}

const AdminPanel = ({stats, laundries, users, userList, laundryList, laundryListSize, userListSize}) => {
  return <DocumentTitle title='document-title.administrator-panel'>
    <main id='AdminPanel' className='topNaved'>
      <FormattedMessage id='admin-panel.title' tagName='h1'/>
      <Stats stats={stats}/>
      <LaundryList laundries={laundryList.map(id => laundries[id])} total={laundryListSize}/>
      <UserList users={userList.map(id => users[id])} total={userListSize}/>
    </main>
  </DocumentTitle>
}

AdminPanel.propTypes = {
  stats: React.PropTypes.object,
  laundries: React.PropTypes.object,
  laundryList: React.PropTypes.array,
  userList: React.PropTypes.array,
  users: React.PropTypes.object,
  userListSize: React.PropTypes.number,
  laundryListSize: React.PropTypes.number
}

module.exports = AdminPanel
