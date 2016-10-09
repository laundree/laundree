const React = require('react')
const {Link} = require('react-router')
class LeftNav extends React.Component {

  constructor (props) {
    super(props)
    this.state = {expanded: false}
    this.toggleHandler = () => this.setState(({expanded}) => ({expanded: !expanded}))
    this.closeHandler = () => this.setState({expanded: false})
  }

  get isOwner () {
    return this.laundry.owners.indexOf(this.props.currentUser) >= 0
  }

  componentWillReceiveProps ({currentUser, users, currentLaundry}) {
    const user = users[currentUser]
    if (!user || user.role === 'admin' || user.laundries.indexOf(currentLaundry) >= 0) return
    window.location = `/`
  }

  get laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  render () {
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
                <span>Timetable</span>
              </Link>
            </li>
            <li>
              <Link
                to={'/laundries/' + this.laundry.id + '/bookings'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#List'/>
                </svg>
                <span>Your bookings</span>
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
                <span>Machines</span>
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
                <span>Users</span>
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
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      {this.props.children}
    </div>
  }
}

LeftNav.propTypes = {
  children: React.PropTypes.any,
  currentUser: React.PropTypes.string.isRequired,
  laundries: React.PropTypes.object,
  currentLaundry: React.PropTypes.string
}

module.exports = LeftNav
