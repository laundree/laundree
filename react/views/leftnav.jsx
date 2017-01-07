const React = require('react')
const {Link} = require('react-router')
const {FormattedMessage} = require('react-intl')
const Loader = require('./loader.jsx')
const sdk = require('../../client/sdk')

class LeftNav extends React.Component {

  constructor (props) {
    super(props)
    this.state = {expanded: false}
    this.toggleHandler = () => this.setState(({expanded}) => ({expanded: !expanded}))
    this.closeHandler = () => this.setState({expanded: false})
  }

  get isOwner () {
    return this.props.user.role === 'admin' || this.laundry.owners.indexOf(this.props.user.id) >= 0
  }

  componentWillReceiveProps ({user, currentLaundry, laundries}) {
    if (!laundries[currentLaundry]) {
      window.location = '/'
      return
    }
    if (!user) return
    if (user.role === 'admin') return
    if (user.laundries.indexOf(currentLaundry) >= 0) return
    window.location = `/`
  }

  get laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  renderNav () {
    if (!this.laundry) return null
    const owner = this.isOwner
    return <div>
      <div className={this.state.expanded ? 'expanded_left_nav' : ''}>
        <div id='MenuExpander' onClick={this.toggleHandler}>
          <svg>
            <use xlinkHref='#MenuLines'/>
          </svg>
          <svg className='close'>
            <use xlinkHref='#CloseX'/>
          </svg>
        </div>
        <nav id='LeftNav'>
          <ul>
            <li>
              <Link
                to={'/laundries/' + this.laundry.id + '/timetable'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#Time'/>
                </svg>
                <FormattedMessage id='leftnav.timetable'/>
              </Link>
            </li>
            <li>
              <Link
                to={'/laundries/' + this.laundry.id + '/bookings'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#List'/>
                </svg>
                <FormattedMessage id='leftnav.own-bookings'/>
              </Link>
            </li>
            {owner
              ? <li>
                <Link
                  to={'/laundries/' + this.laundry.id + '/machines'} activeClassName='active'
                  onClick={this.closeHandler}>
                  <svg>
                    <use xlinkHref='#SimpleMachine'/>
                  </svg>
                  <FormattedMessage id='leftnav.machines'/>
                </Link>
              </li>
              : null}
            {owner
              ? <li>
                <Link
                  to={'/laundries/' + this.laundry.id + '/users'} activeClassName='active'
                  onClick={this.closeHandler}>
                  <svg>
                    <use xlinkHref='#Users'/>
                  </svg>
                  <FormattedMessage id='leftnav.users'/>
                </Link>
              </li>
              : null}
          </ul>
          <hr/>
          <ul>
            <li>
              <Link
                to={'/laundries/' + this.laundry.id + '/settings'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#Gears'/>
                </svg>
                <FormattedMessage id='leftnav.settings'/>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      {this.props.children}
    </div>
  }

  load () {
    return sdk.fetchLaundry(this.props.currentLaundry)
  }

  render () {
    return <Loader loader={() => this.load()} loaded={this.laundry}>
      {this.renderNav()}
    </Loader>
  }
}

LeftNav.propTypes = {
  children: React.PropTypes.any,
  user: React.PropTypes.object.isRequired,
  laundries: React.PropTypes.object,
  currentLaundry: React.PropTypes.string
}

module.exports = LeftNav
