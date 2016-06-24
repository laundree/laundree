const React = require('react')
const {Link} = require('react-router')

class LeftNav extends React.Component {

  constructor (props) {
    super(props)
    this.state = {expanded: false}
  }

  render () {
    const clickHandler = () => this.setState({expanded: !this.state.expanded})
    return <div className={this.state.expanded ? 'expanded_left_nav' : ''}>
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
            <Link to={'/laundries/' + this.props.currentLaundry + '/timetable'} activeClassName='active'>
              <svg>
                <use xlinkHref='#Time'/>
              </svg>
              <span>Timetable</span>
            </Link>
          </li>
          <li data-label='Your bookings'>
            <Link to={'/laundries/' + this.props.currentLaundry + '/bookings'} activeClassName='active'>
              <svg>
                <use xlinkHref='#List'/>
              </svg>
              <span>Your bookings</span>
            </Link>
          </li>
        </ul>
        <hr/>
        <ul>
          <li data-label='Settings'>
            <Link to={'/laundries/' + this.props.currentLaundry + '/settings'} activeClassName='active'>
              <svg>
                <use xlinkHref='#Gears'/>
              </svg>
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  }
}

LeftNav.propTypes = {
  currentLaundry: React.PropTypes.string.isRequired
}

module.exports = LeftNav
