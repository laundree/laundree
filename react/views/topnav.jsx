/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Link} = require('react-router')
const {DropDown, DropDownTitle, DropDownContent, DropDownCloser} = require('./dropdown.jsx')

class TopNav extends React.Component {

  get laundries () {
    return this.props.user.laundries.map(id => this.props.laundries[id]).filter(l => l)
  }

  renderLaundries () {
    const laundries = this.laundries
    const currentLaundry = this.props.laundries[this.props.currentLaundry]
    if (!currentLaundry) return null
    switch (laundries.length) {
      case 0:
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
                      <a href={'/laundries/' + id}>{name}</a>
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
            {this.props.user.demo ? null : <li>
              <DropDownCloser>
                <Link to={`/users/${this.props.user.id}`} activeClassName='active'>
                  Manage your account
                </Link>
              </DropDownCloser>
            </li>}
            <li>
              <a href='/logout'>
                Log out
              </a>
            </li>
          </ul>
        </DropDownContent>
      </DropDown>
      <Link to='/support' className='icon help' activeClassName='active'>
        <svg>
          <use xlinkHref='#LifeBuoy'/>
        </svg>
        Support
      </Link>
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
      <Link to='/contact' className='icon contact' activeClassName='active'>
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
    demo: React.PropTypes.boolean,
    laundries: React.PropTypes.arrayOf(React.PropTypes.string)
  }),
  currentLaundry: React.PropTypes.string,
  laundries: React.PropTypes.object
}

module.exports = TopNav
