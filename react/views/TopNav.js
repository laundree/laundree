/**
 * Created by budde on 05/06/16.
 */
const React = require('react')
const {Link} = require('react-router')
const {DropDown, DropDownTitle, DropDownContent, DropDownCloser} = require('./dropdown')
const LocaleSelect = require('./LocaleSelect')
const {FormattedMessage} = require('react-intl')

class TopNav extends React.Component {
  get laundries () {
    return this.props.user.laundries.map(id => this.props.laundries[id]).filter(l => l)
  }

  renderGlobe () {
    return <LocaleSelect locale={this.props.config.locale} location={this.props.location}/>
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
      <Link to='/support' className='icon help' activeClassName='active'>
        <svg>
          <use xlinkHref='#LifeBuoy'/>
        </svg>
        <FormattedMessage id='topnav.support'/>
      </Link>
      <div className='rightNav'>
        {this.renderGlobe()}
        <DropDown className='user'>
          <DropDownTitle>
            <img src={this.props.user.photo} className='avatar'/>
          </DropDownTitle>
          <DropDownContent className='right'>
            <ul className='dropDownList'>
              {this.props.user.demo ? null : <li>
                  <DropDownCloser>
                    <Link to={`/users/${this.props.user.id}`} activeClassName='active'>
                      <FormattedMessage id='topnav.manage'/>
                    </Link>
                  </DropDownCloser>
                </li>}
              <li>
                <a href='/logout'>
                  <FormattedMessage id='topnav.logout'/>
                </a>
              </li>
            </ul>
          </DropDownContent>
        </DropDown>
      </div>
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
        <FormattedMessage id='topnav.about'/>
      </Link>
      <Link to='/contact' className='icon contact' activeClassName='active'>
        <svg>
          <use xlinkHref='#EMail4'/>
        </svg>
        <FormattedMessage id='topnav.contact'/>
      </Link>
      <div className='rightNav'>
        {this.renderGlobe()}
        <Link to={this.props.config.returningUser ? '/auth' : '/auth/sign-up'} className='log-in'>
          <FormattedMessage id={this.props.config.returningUser ? 'topnav.login' : 'topnav.sign-up'}/>
        </Link>
      </div>
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
  location: React.PropTypes.object,
  currentLaundry: React.PropTypes.string,
  config: React.PropTypes.shape({
    locale: React.PropTypes.string.isRequired,
    returningUser: React.PropTypes.bool.isRequired
  }),
  laundries: React.PropTypes.object
}

module.exports = TopNav
