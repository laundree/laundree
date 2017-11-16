// @flow
import React from 'react'
import { NavLink } from 'react-router-dom'
import { DropDown, DropDownTitle, DropDownContent, DropDownCloser } from './dropdown'
import LocaleSelect from './LocaleSelect'
import { FormattedMessage } from 'react-intl'
import type { User, Laundry, State } from 'laundree-sdk/lib/redux'
import { Link as ScrollLink } from 'react-scroll'
import { connect } from 'react-redux'

type TopNavProps = {
  user: ?User,
  currentLaundry: string,
  laundries: { [string]: Laundry }
}

class TopNav extends React.Component<TopNavProps> {
  laundries (user: User) {
    return user.laundries.map(id => this.props.laundries[id]).filter(l => l)
  }

  renderGlobe () {
    return <LocaleSelect />
  }

  renderLaundries (user: User) {
    const laundries = this.laundries(user)
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
                      <a href={`/laundries/${id}`}>{name}</a>
                    </DropDownCloser>
                  </li>)}
            </ul>
          </DropDownContent>
        </DropDown>
    }
  }

  renderUserLoggedInMenu (user: User) {
    return <nav id='TopNav'>
      <NavLink to={''} className='home' activeClassName='active'>
        <svg>
          <use xlinkHref='#SmallLogo' />
        </svg>
      </NavLink>
      <div className='laundries'>
        {this.renderLaundries(user)}
      </div>
      <NavLink to={'/support'} className='icon help' activeClassName='active'>
        <svg>
          <use xlinkHref='#LifeBuoy' />
        </svg>
        <FormattedMessage id='topnav.support' />
      </NavLink>
      <div className='rightNav'>
        {this.renderGlobe()}
        <DropDown className='user'>
          <DropDownTitle>
            <img src={user.photo} className='avatar' />
          </DropDownTitle>
          <DropDownContent className='right'>
            <ul className='dropDownList'>
              {user.demo ? null : <li>
                <DropDownCloser>
                  <NavLink to={`/users/${user.id}/settings`} activeClassName='active'>
                    <FormattedMessage id='topnav.manage' />
                  </NavLink>
                </DropDownCloser>
              </li>}
              <li>
                <a href={'/logout'}>
                  <FormattedMessage id='topnav.logout' />
                </a>
              </li>
            </ul>
          </DropDownContent>
        </DropDown>
      </div>
    </nav>
  }

  renderNotLoggedInMenu () {
    return (
      <nav id='TopNav' className='large'>
        <div className='container'>
          <NavLink to={''} className='logo'>
            <svg>
              <use xlinkHref='#WhiteLogo' />
            </svg>
          </NavLink>
          <ScrollLink to='AboutSection' className='icon about' smooth>
            <svg>
              <use xlinkHref='#Info' />
            </svg>
            <FormattedMessage id='topnav.about' />
          </ScrollLink>
          <ScrollLink to='ContactSection' className='icon contact' smooth>
            <svg>
              <use xlinkHref='#EMail4' />
            </svg>
            <FormattedMessage id='topnav.contact' />
          </ScrollLink>
          <div className='rightNav'>
            {this.renderGlobe()}
            <NavLink to={'/auth'} className='auth signUp'>
              <FormattedMessage id='topnav.login' />
            </NavLink>
          </div>
        </div>
      </nav>
    )
  }

  render () {
    const user = this.props.user
    return user
      ? this.renderUserLoggedInMenu(user)
      : this.renderNotLoggedInMenu()
  }
}

export default connect(({users, currentUser, laundries}: State, {match: {params: {laundryId}}}): TopNavProps => ({
  laundries,
  currentLaundry: laundryId,
  user: (currentUser && users[currentUser]) || null
}))(TopNav)
