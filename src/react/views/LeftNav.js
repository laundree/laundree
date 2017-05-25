import React from 'react'
import { NavLink } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import Loader from './Loader'
import sdk from '../../client/sdk'
import NotFound from '../containers/NotFound'
import { Route, Switch, Redirect } from 'react-router'
import Timetable from '../containers/Timetable'
import Bookings from '../containers/Bookings'
import LaundrySettings from '../containers/LaundrySettings'
import Machines from '../containers/Machines'
import Users from '../containers/Users'

const OwnerCheckRoute = ({user, laundry, component: Component, path}) => <Route render={props => {
  if (user.role !== 'admin' && laundry.owners.indexOf(user.id) < 0) {
    return <NotFound />
  }
  return <Component {...props} />
}} />

OwnerCheckRoute.propTypes = {
  user: React.PropTypes.object.isRequired,
  laundry: React.PropTypes.object.isRequired,
  component: Route.propTypes.component,
  path: Route.propTypes.path
}

export default class LeftNav extends React.Component {

  props: {
    user: User,
    laundries: { [string]: Laundry },
    currentLaundry: string
  }

  constructor (props) {
    super(props)
    this.state = {expanded: false}
    this.toggleHandler = () => this.setState(({expanded}) => ({expanded: !expanded}))
    this.closeHandler = () => this.setState({expanded: false})
  }

  get isOwner () {
    return this.props.user.role === 'admin' || this.laundry.owners.indexOf(this.props.user.id) >= 0
  }

  get laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  renderNav () {
    if (!this.laundry) return null
    const owner = this.isOwner
    return <div>
      <div className={this.state.expanded ? 'expanded_left_nav' : ''}>
        <div id='MenuExpander' onClick={this.toggleHandler}>
          <svg>
            <use xlinkHref='#MenuLines' />
          </svg>
          <svg className='close'>
            <use xlinkHref='#CloseX' />
          </svg>
        </div>
        <nav id='LeftNav'>
          <ul>
            <li>
              <NavLink
                to={'/laundries/' + this.laundry.id + '/timetable'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#Time' />
                </svg>
                <FormattedMessage id='leftnav.timetable' />
              </NavLink>
            </li>
            <li>
              <NavLink
                to={'/laundries/' + this.laundry.id + '/bookings'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#List' />
                </svg>
                <FormattedMessage id='leftnav.own-bookings' />
              </NavLink>
            </li>
            {owner
              ? <li>
                <NavLink
                  to={'/laundries/' + this.laundry.id + '/machines'} activeClassName='active'
                  onClick={this.closeHandler}>
                  <svg>
                    <use xlinkHref='#SimpleMachine' />
                  </svg>
                  <FormattedMessage id='leftnav.machines' />
                </NavLink>
              </li>
              : null}
            {owner
              ? <li>
                <NavLink
                  to={'/laundries/' + this.laundry.id + '/users'} activeClassName='active'
                  onClick={this.closeHandler}>
                  <svg>
                    <use xlinkHref='#Users' />
                  </svg>
                  <FormattedMessage id='leftnav.users' />
                </NavLink>
              </li>
              : null}
          </ul>
          <hr />
          <ul>
            <li>
              <NavLink
                to={'/laundries/' + this.laundry.id + '/settings'} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#Gears' />
                </svg>
                <FormattedMessage id='leftnav.settings' />
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      {this.renderContent()}
    </div>
  }

  renderContent () {
    return (
      <Switch>
        <Redirect exact from='/laundries/:laundryId' to={`/laundries/${this.laundry.id}/timetable`} />
        <Route path='/laundries/:laundryId/timetable' component={Timetable} />
        <Route path='/laundries/:laundryId/bookings' component={Bookings} />
        <Route path='/laundries/:laundryId/settings' component={LaundrySettings} />
        <OwnerCheckRoute
          user={this.props.user}
          laundry={this.laundry}
          path='/laundries/:laundryId/machines'
          component={Machines} />
        <OwnerCheckRoute
          user={this.props.user}
          laundry={this.laundry}
          path='/laundries/:laundryId/users'
          component={Users} />
        <Route component={NotFound} />
      </Switch>
    )
  }

  load () {
    return sdk
      .fetchLaundry(this.props.currentLaundry)
  }

  render () {
    if (this.props.user.role !== 'admin' && this.props.user.laundries.indexOf(this.props.currentLaundry) < 0) {
      return <NotFound />
    }
    return <Loader loader={() => this.load()} loaded={this.laundry}>
      {this.renderNav()}
    </Loader>
  }
}
