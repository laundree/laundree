const React = require('react')
const {Link} = require('react-router')
class LeftNav extends React.Component {

  constructor (props) {
    super(props)
    this.state = {expanded: false}
  }

  get isOwner () {
    return this.props.laundry.owners.indexOf(this.props.currentUser) >= 0
  }

  render () {
    if (!this.props.laundry) return null
    const clickHandler = () => this.setState({expanded: !this.state.expanded})
    const owner = this.isOwner
    return <div>
      <div className={this.state.expanded ? 'expanded_left_nav' : ''}>
        <div id='MenuExpander' onClick={clickHandler}>
          <svg>
            <use xlinkHref='#MenuLines'/>
          </svg>
          <svg className='close'>
            <use xlinkHref='#CloseX'/>
          </svg>
        </div>
        <nav id='LeftNav'>
          <ul>
            <li data-label='Timetable'>
              <Link to={'/laundries/' + this.props.laundry.id + '/timetable'} activeClassName='active'>
                <svg>
                  <use xlinkHref='#Time'/>
                </svg>
                <span>Timetable</span>
              </Link>
            </li>
            <li data-label='Your bookings'>
              <Link to={'/laundries/' + this.props.laundry.id + '/bookings'} activeClassName='active'>
                <svg>
                  <use xlinkHref='#List'/>
                </svg>
                <span>Your bookings</span>
              </Link>
            </li>
            {owner
              ? <li data-label='Machines'>
              <Link to={'/laundries/' + this.props.laundry.id + '/machines'} activeClassName='active'>
                <svg>
                  <use xlinkHref='#SimpleMachine'/>
                </svg>
                <span>Machines</span>
              </Link>
            </li>
              : null}
            {owner
              ? <li data-label='Users'>
              <Link to={'/laundries/' + this.props.laundry.id + '/users'} activeClassName='active'>
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
            <li data-label='Settings'>
              <Link to={'/laundries/' + this.props.laundry.id + '/settings'} activeClassName='active'>
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
  laundry: React.PropTypes.object
}

module.exports = LeftNav
