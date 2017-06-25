// @flow
import React from 'react'
import { DocumentTitle } from './intl'
import { Link } from 'react-router-dom'
import sdk from '../../client/sdk'
import { FormattedMessage } from 'react-intl'
import Switch from './Switch'
import Debug from 'debug'
import type {Stats, Laundry, User} from 'laundree-sdk/lib/redux'
import type { ListOptions } from 'laundree-sdk/lib/sdk'
const debug = Debug('laundree.react.views.AdminPanel')

class StatsComponent extends React.Component {
  props: { stats: Stats }

  componentDidMount () {
    sdk.updateStats()
  }

  renderStats () {
    const {realLaundryCount, realUserCount, demoUserCount, demoLaundryCount, machineCount, bookingCount} = this.stats()
    return <ul className={this.props.stats ? '' : 'loading'}>
      <li>
        <span className='value'>{realUserCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.users' />
        </span>
      </li>
      <li>
        <span className='value'>{demoUserCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.demo-users' />
        </span>
      </li>
      <li>
        <span className='value'>{realLaundryCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.laundries' />
        </span>
      </li>
      <li>
        <span className='value'>{demoLaundryCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.demo-laundries' />
        </span>
      </li>
      <li>
        <span className='value'>{machineCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.machines' />
        </span>
      </li>
      <li>
        <span className='value'>{bookingCount}</span>
        <span className='label'>
          <FormattedMessage id='admin-panel.bookings' />
        </span>
      </li>
    </ul>
  }

  stats () {
    if (!this.props.stats) return {}
    const {laundryCount, demoLaundryCount, userCount, demoUserCount} = this.props.stats
    return {
      ...this.props.stats,
      realLaundryCount: laundryCount - demoLaundryCount,
      realUserCount: userCount - demoUserCount
    }
  }

  render () {
    return <section id='Stats'>
      <FormattedMessage id='admin-panel.stats-title' tagName='h2' />
      {this.renderStats()}
    </section>
  }
}

class QueryList<T: { id: string }> extends React.Component<void,
  {
    elements: T[],
    totalDemo: ?number,
    total: ?number
  },
  { loaded: boolean, page: number, q: ? string, demoOn: boolean }> {

  limit = 10
  state = {
    loaded: false,
    page: 0,
    q: null,
    demoOn: false
  }

  updateFilter (q: ?string) {
    this.setState({q}, () => this._load())
  }

  componentDidMount () {
    this._load()
  }

  prev () {
    if (this.currentPage() === 0) return
    this.setState({page: this.currentPage() - 1}, () => this._load())
  }

  next () {
    if (this.currentPage() === this.totalPages()) return
    this.setState({page: this.currentPage() + 1}, () => this._load())
  }

  load (options) {
    throw new Error('Not implemented')
  }

  _load () {
    const config = {
      q: this.state.q || undefined,
      showDemo: this.state.demoOn,
      limit: this.limit,
      skip: this.limit * this.currentPage()
    }
    debug('Loading', config)
    return this
      .load(config)
      .then(() => this.setState({loaded: true, page: this.currentPage()}))
  }

  renderLoading () {
    throw new Error('Not implemented')
  }

  renderEmpty () {
    throw new Error('Not implemented')
  }

  renderElement (elm: T) {
    throw new Error('Not implemented')
  }

  currentPage () {
    return Math.max(0, Math.min(this.state.page, this.totalPages()))
  }

  totalPages () {
    if (typeof this.props.total !== 'number') {
      return 0
    }
    if (typeof this.props.totalDemo !== 'number') {
      return 0
    }
    return Math.max(0, Math.floor(((this.state.demoOn ? this.props.total : this.props.total - this.props.totalDemo) - 1) / this.limit))
  }

  toggleDemo (on) {
    this.setState({demoOn: on}, () => this._load())
  }

  renderList () {
    if (!this.state.loaded) {
      return <div className='bigListMessage'>
        {this.renderLoading()}
      </div>
    }
    return <div>
      <div className='nav'>
        <span className={'prev link' + (this.currentPage === 0 ? ' inactive' : '')} onClick={() => this.prev()} />
        <FormattedMessage
          id='admin-panel.page-of'
          values={{
            page: this.currentPage() + 1,
            numPages: this.totalPages() + 1
          }}
        />
        <span
          className={'next link' + (this.currentPage() === this.totalPages() ? ' inactive' : '')}
          onClick={() => this.next()} />
      </div>
      <div className='filter'>
        <label>
          <input
            type='text' placeholder='Filter' value={this.state.q || ''}
            onChange={({target: {value}}) => this.updateFilter(value)} />
        </label>
        <div className='demoSwitch'>
          <Switch onChange={demoOn => this.toggleDemo(demoOn)} on={this.state.demoOn} />
          <FormattedMessage id='admin-panel.show-demo' />
        </div>
      </div>
      {this.props.elements.length
        ? <ul className='bigList'>
          { this.props.elements.map(element => <li key={element.id}>{this.renderElement(element)}</li>)}
        </ul>
        : <div className='bigListMessage'>
          {this.renderEmpty()}
        </div>}
    </div>
  }
}

class LaundryList extends QueryList<Laundry> {

  renderLoading () {
    return <FormattedMessage id='admin-panel.loading' />
  }

  renderEmpty () {
    return <FormattedMessage id='admin-panel.no-laundries' />
  }

  renderElement (l: Laundry) {
    return <div className='name'>
      <Link to={`/laundries/${l.id}`}>
        {l.name}
      </Link>
    </div>
  }

  load (options: ListOptions) {
    return sdk.listLaundries(options)
  }

  render () {
    return <section id='LaundryList'>
      <FormattedMessage id='admin-panel.laundries' tagName='h2' />
      {this.renderList()}
    </section>
  }
}

class UserList extends QueryList<User> {

  load (options: ListOptions) {
    return sdk.listUsers(options)
  }

  renderLoading () {
    return <FormattedMessage id='admin-panel.loading' />
  }

  renderEmpty () {
    return <FormattedMessage id='admin-panel.no-users' />
  }

  renderElement ({id, photo, displayName}: User) {
    return <div className='name'>
      <Link to={`/users/${id}/settings`}>
        <img src={photo} className='avatar' />
        {displayName}
      </Link>
    </div>
  }

  render () {
    return <section id='UserList'>
      <FormattedMessage id='admin-panel.users' tagName='h2' />

      {this.renderList()}
    </section>
  }
}

const AdminPanel = ({stats, laundries, users, userList, laundryList}: {
  stats: Stats,
  laundries: { [string]: Laundry },
  users: { [string]: User },
  userList: string[],
  laundryList: string[]
}) => {
  const ls: Laundry[] = laundryList.map(id => laundries[id]).filter((l: ?Laundry) => l)
  const us: User[] = userList.map(id => users[id]).filter(u => u)
  return <DocumentTitle title='document-title.administrator-panel'>
    <main id='AdminPanel' className='topNaved'>
      <FormattedMessage id='admin-panel.title' tagName='h1' />
      <StatsComponent stats={stats} />
      <LaundryList elements={ls} totalDemo={stats && stats.demoLaundryCount} total={stats && stats.laundryCount} />
      <UserList elements={us} totalDemo={stats && stats.demoUserCount} total={stats && stats.userCount} />
    </main>
  </DocumentTitle>
}

export default AdminPanel
