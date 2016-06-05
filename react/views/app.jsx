/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Link} = require('react-router')
const DocumentTitle = require('react-document-title')

class App extends React.Component {

  constructor (props) {
    super(props)
    this.state = {expanded: false}
  }

  render () {
    const TopNav = require('../containers/topnav')
    const clickHandler = () => this.setState({expanded: !this.state.expanded})
    return <DocumentTitle title='Laundree.io'>
      <div className={this.state.expanded ? 'expanded_left_nav' : ''}>
        <TopNav />
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
              <Link to='/app/timetable' activeClassName='active'>
                <svg>
                  <use xlinkHref='#Time'/>
                </svg>
                <span>Timetable</span>
              </Link>
            </li>
            <li data-label='Your bookings'>
              <Link to='/app/bookings' activeClassName='active'>
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
              <Link to='/app/settings' activeClassName='active'>
                <svg>
                  <use xlinkHref='#Gears'/>
                </svg>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div id='RightContent'>
          {this.props.children}
        </div>
      </div>
    </DocumentTitle>
  }
}

App.propTypes = {
  children: React.PropTypes.any
}

module.exports = App
