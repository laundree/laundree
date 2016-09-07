/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Link} = require('react-router')
const {DropDown, DropDownTitle, DropDownContent, DropDownCloser} = require('./dropdown.jsx')

class TopNav extends React.Component {

  get laundries () {
    return this.props.user.laundries.map(id => this.props.laundries[id])
  }

  renderLaundries () {
    const laundries = this.laundries
    const currentLaundry = this.props.laundries[this.props.currentLaundry]
    if (!currentLaundry) return null
    switch (laundries.length) {
      case 0:
        return null
      case 1:
        return <div><span>{currentLaundry.name}</span></div>
      default:
        return <DropDown>
          <DropDownTitle>
            {currentLaundry.name}
          </DropDownTitle>
          <DropDownContent className='noArrow'>
            <ul className='dropDownList'>
              {laundries
                .map(({id, name}) =>
                  <li key={id} className={id === this.props.currentLaundry ? 'active' : ''}>
                    <DropDownCloser>
                      <Link to={'/laundries/' + id}>{name}</Link>
                    </DropDownCloser>
                  </li>)}
            </ul>
          </DropDownContent>
        </DropDown>
    }
  }

  renderUserLoggedInMenu () {
    return <nav id='TopNav'>
      <Link to='/' className='home' activeClassName='active'>
        <svg>
          <use xlinkHref='#SmallLogo'/>
        </svg>
      </Link>
      <div className='laundries'>
        {this.renderLaundries()}
      </div>
      <DropDown className='user'>
        <DropDownTitle>
          <img src={this.props.user.photo} className='avatar'/>
        </DropDownTitle>
        <DropDownContent className='right'>
          <ul className='dropDownList'>
            <li>
              <DropDownCloser>
                <Link to='/settings' activeClassName='active'>
                  Manage your account
                </Link>
              </DropDownCloser>
            </li>
            <li>
              <a href='/logout'>
                Log out
              </a>
            </li>
          </ul>
        </DropDownContent>
      </DropDown>
      <a href='/support' className='icon help'>
        <svg>
          <use xlinkHref='#LifeBuoy'/>
        </svg>
        Support
      </a>
    </nav>
  }

  renderNotLoggedInMenu () {
    return <nav id='TopNav'>
      <Link to='/' className='home' activeClassName='active'>
        <svg>
          <use xlinkHref='#SmallLogo'/>
        </svg>
      </Link>
      <Link to='/about' className='icon about' activeClassName='active'>
        <svg>
          <use xlinkHref='#Info'/>
        </svg>
        About us
      </Link>
      <Link to='/support' className='icon help'>
        <svg>
          <use xlinkHref='#LifeBuoy'/>
        </svg>
        Support
      </Link>
      <Link to='/contact' className='icon contact'>
        <svg>
          <use xlinkHref='#EMail4'/>
        </svg>
        Contact
      </Link>
      <Link to='/auth' className='log-in'>Log in</Link>
    </nav>
  }

  render () {
    return this.props.user ? this.renderUserLoggedInMenu() : this.renderNotLoggedInMenu()
  }
}
TopNav.propTypes = {
  user: React.PropTypes.shape({
    id: React.PropTypes.string,
    photo: React.PropTypes.string,
    laundries: React.PropTypes.arrayOf(React.PropTypes.string)
  }),
  currentLaundry: React.PropTypes.string,
  laundries: React.PropTypes.object
}

module.exports = TopNav
