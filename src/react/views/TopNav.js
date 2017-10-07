// @flow
import React from 'react'
import { NavLink } from 'react-router-dom'
import { DropDown, DropDownTitle, DropDownContent, DropDownCloser } from './dropdown'
import LocaleSelect from './LocaleSelect'
import { FormattedMessage } from 'react-intl'
import type { User, Config, Laundry } from 'laundree-sdk/lib/redux'
import type { Location } from 'react-router'
import { toLocale } from '../../locales'

export default class TopNav extends React.Component<{
  user: User,
  location: Location,
  currentLaundry: string,
  config: Config,
  laundries: { [string]: Laundry }
}> {

  laundries () {
    return this.props.user.laundries.map(id => this.props.laundries[id]).filter(l => l)
  }

  locale () {
    return toLocale(this.props.config.locale || '', 'en')
  }

  renderGlobe () {
    return <LocaleSelect locale={this.locale()} location={this.props.location} />
  }

  renderLaundries () {
    const laundries = this.laundries()
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
      <NavLink to='/' className='home' activeClassName='active'>
        <svg>
          <use xlinkHref='#SmallLogo' />
        </svg>
      </NavLink>
      <div className='laundries'>
        {this.renderLaundries()}
      </div>
      <NavLink to='/support' className='icon help' activeClassName='active'>
        <svg>
          <use xlinkHref='#LifeBuoy' />
        </svg>
        <FormattedMessage id='topnav.support' />
      </NavLink>
      <div className='rightNav'>
        {this.renderGlobe()}
        <DropDown className='user'>
          <DropDownTitle>
            <img src={this.props.user.photo} className='avatar' />
          </DropDownTitle>
          <DropDownContent className='right'>
            <ul className='dropDownList'>
              {this.props.user.demo ? null : <li>
                <DropDownCloser>
                  <NavLink to={`/users/${this.props.user.id}/settings`} activeClassName='active'>
                    <FormattedMessage id='topnav.manage' />
                  </NavLink>
                </DropDownCloser>
              </li>}
              <li>
                <a href='/logout'>
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
          <NavLink to='/' className='logo'>
            <svg>
              <use xlinkHref='#WhiteLogo' />
            </svg>
          </NavLink>
          <NavLink to='/about' className='icon about' activeClassName='active'>
            <svg>
              <use xlinkHref='#Info' />
            </svg>
            <FormattedMessage id='topnav.about' />
          </NavLink>
          <NavLink to='/contact' className='icon contact' activeClassName='active'>
            <svg>
              <use xlinkHref='#EMail4' />
            </svg>
            <FormattedMessage id='topnav.contact' />
          </NavLink>
          <div className='rightNav'>
            {this.renderGlobe()}
            <NavLink to='/auth' className='auth signUp'>
              <FormattedMessage id='topnav.login' />
            </NavLink>
          </div>
        </div>
      </nav>
    )
  }

  render () {
    return this.props.user ? this.renderUserLoggedInMenu() : this.renderNotLoggedInMenu()
  }
}
