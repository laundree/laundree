// @flow
import React from 'react'
import { NavLink } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import Loader from './Loader'
import sdk from '../../client/sdk'
import NotFound from '../views/NotFound'
import { Route, Switch, Redirect } from 'react-router'
import Timetable from '../containers/Timetable'
import Bookings from '../containers/Bookings'
import LaundrySettings from '../containers/LaundrySettings'
import Machines from '../containers/Machines'
import Users from '../containers/Users'
import type { User, Laundry } from 'laundree-sdk/lib/redux'

const OwnerCheckRoute = ({user, laundry, render, path}: { user: User, laundry: Laundry, render: (props: *) => React$Element<*>, path: string }) => (
  <Route path={path} render={props => {
    if (user.role !== 'admin' && laundry.owners.indexOf(user.id) < 0) {
      return <NotFound/>
    }
    return render(props)
  }}/>)

export default class LeftNav extends React.Component<{
  user: User,
  laundries: { [string]: Laundry },
  currentLaundry: string
}, { expanded: boolean }> {

  state = {expanded: false}

  toggleHandler = () => this.setState(({expanded}) => ({expanded: !expanded}))

  closeHandler = () => this.setState({expanded: false})

  isOwner () {
    return this.props.user.role === 'admin' || this.laundry().owners.indexOf(this.props.user.id) >= 0
  }

  laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  renderNav () {
    const laundry = this.laundry()
    if (!laundry) return null
    const owner = this.isOwner()
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
              <NavLink
                to={'/laundries/' + laundry.id + '/timetable'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#Time'/>
                </svg>
                <FormattedMessage id='leftnav.timetable'/>
              </NavLink>
            </li>
            <li>
              <NavLink
                to={'/laundries/' + laundry.id + '/bookings'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#List'/>
                </svg>
                <FormattedMessage id='leftnav.own-bookings'/>
              </NavLink>
            </li>
            {owner
              ? <li>
                <NavLink
                  to={'/laundries/' + laundry.id + '/machines'} activeClassName='active'
                  onClick={this.closeHandler}>
                  <svg>
                    <use xlinkHref='#SimpleMachine'/>
                  </svg>
                  <FormattedMessage id='leftnav.machines'/>
                </NavLink>
              </li>
              : null}
            {owner
              ? <li>
                <NavLink
                  to={'/laundries/' + laundry.id + '/users'} activeClassName='active'
                  onClick={this.closeHandler}>
                  <svg>
                    <use xlinkHref='#Users'/>
                  </svg>
                  <FormattedMessage id='leftnav.users'/>
                </NavLink>
              </li>
              : null}
          </ul>
          <hr/>
          <ul>
            <li>
              <NavLink
                to={'/laundries/' + laundry.id + '/settings'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#Gears'/>
                </svg>
                <FormattedMessage id='leftnav.settings'/>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      {this.renderContent()}
    </div>
  }

  renderContent () {
    const laundry = this.laundry()
    return (
      <Switch>
        <Redirect exact from='/laundries/:laundryId' to={`/laundries/${this.laundry().id}/timetable`}/>
        <Route path='/laundries/:laundryId/timetable' component={Timetable}/>
        <Route path='/laundries/:laundryId/bookings' component={Bookings}/>
        <Route path='/laundries/:laundryId/settings' component={LaundrySettings}/>
        <OwnerCheckRoute
          user={this.props.user}
          laundry={laundry}
          render={props => <Machines {...props} />}
          path='/laundries/:laundryId/machines'/>
        <OwnerCheckRoute
          user={this.props.user}
          laundry={laundry}
          render={props => <Users {...props} />}
          path='/laundries/:laundryId/users'/>
        <Route component={NotFound}/>
      </Switch>
    )
  }

  load () {
    return sdk
      .fetchLaundry(this.props.currentLaundry)
  }

  render () {
    if (this.props.user.role !== 'admin' && this.props.user.laundries.indexOf(this.props.currentLaundry) < 0) {
      return <NotFound/>
    }
    return <Loader loader={() => this.load()} loaded={Boolean(this.laundry())}>
      {this.renderNav()}
    </Loader>
  }
}
