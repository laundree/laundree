// @flow
import React from 'react'
import { NavLink } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import Loader from './Loader'
import sdk from '../client/sdk'
import NotFound from './NotFound'
import { Route, Switch, Redirect } from 'react-router'
import Timetable from './Timetable'
import Bookings from './Bookings'
import LaundrySettings from './LaundrySettings'
import Machines from './Machines'
import Users from './Users'
import type { User, Laundry, State } from 'laundree-sdk/lib/redux'
import { connect } from 'react-redux'

const OwnerCheckRoute = ({user, laundry, render, path}: { user: User, laundry: Laundry, render: (props: *) => React$Element<*>, path: string }) => (
  <Route path={path} render={props => {
    if (user.role !== 'admin' && laundry.owners.indexOf(user.id) < 0) {
      return <NotFound />
    }
    return render(props)
  }} />)

type LeftNavProps = {
  user: ?User,
  laundries: { [string]: Laundry },
  currentLaundry: string
}

type TourElementProps = {
  completed?: boolean,
  children?: *,
  title: string,
}

class TourStep extends React.PureComponent<TourElementProps> {
  _renderContent () {
    if (this.props.children) {
      return this.props.children
    }
    const {onPrev, onNext, render} = this.props
    if (!onPrev || !onNext || !render) return null
    return render({onPrev, onNext})
  }

  render () {
    return (
      <div>{this._renderContent()}</div>
    )
  }
}

class Tour extends React.PureComponent<{ children: *, onClose: () => * }> {

  _navContainerStyle = {
    backgroundColor: '#55b7b6',
    width: '20em',
    position: 'absolute',
    right: 0,
    zIndex: 400,
    bottom: 0,
    top: 0,
    paddingTop: '5em',
    boxShadow: '#272727 0px 0px 0.4em'
  }

  _buttonStyle = {
    display: 'block',
    width: '100%',
    padding: '1em 0'
  }

  render () {
    const children = React.Children.toArray(this.props.children)
    if (!children.length) {
      return null
    }
    const {step} = children
      .map((child, step) => ({child, step}))
      .find(({child}) => !child.props.completed)
    return (
      <div style={this._navContainerStyle}>
        <ul style={{listStyleType: 'none'}}>
          {children.map((child, i) => (
            <li key={i} style={{padding: '1em 1em'}}>
              {i === step
                ? (
                  <div>
                    <div>
                      <b>
                        {child.props.title}
                      </b>
                    </div>
                    {child}
                  </div>)
                : (
                  <div>
                    {child.props.title}
                  </div>
                )}
            </li>
          ))}
        </ul>
        <div style={{position: 'absolute', bottom: 0, width: '100%'}}>
          <div style={{padding: '1em 2em', textAlign: 'center'}}>
            Step {step + 1} of {children.length}
          </div>
          <div style={{
            height: '0.2em',
            backgroundColor: '#befffe',
            width: `${((step + 1) / children.length) * 100}%`
          }} />
          <div>
            <button
              onClick={this.props.onClose}
              style={this._buttonStyle}
              className={'red'}>
              Stop tour
            </button>
          </div>
        </div>
      </div>
    )
  }
}

class LeftNav extends React.Component<LeftNavProps, { expanded: boolean, tour: boolean }> {

  state = {expanded: false, tour: false}

  toggleHandler = () => this.setState(({expanded}) => ({expanded: !expanded}))

  closeHandler = () => this.setState({expanded: false})

  isOwner (user: User) {
    return user.role === 'admin' || this.laundry().owners.indexOf(user.id) >= 0
  }

  laundry () {
    return this.props.laundries[this.props.currentLaundry]
  }

  renderNav (user: User) {
    const laundry = this.laundry()
    if (!laundry) return null
    const owner = this.isOwner(user)
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
                to={`/laundries/${laundry.id}/timetable`} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#Time' />
                </svg>
                <FormattedMessage id='leftnav.timetable' />
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`/laundries/${laundry.id}/bookings`} activeClassName='active'
                onClick={this.closeHandler}>
                <svg>
                  <use xlinkHref='#List' />
                </svg>
                <FormattedMessage id='leftnav.own-bookings' />
              </NavLink>
            </li>
            {owner
              ? <li ref={this._machineRefPuller}>
                <NavLink
                  to={`/laundries/${laundry.id}/machines`} activeClassName='active'
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
                  to={`/laundries/${laundry.id}/users`} activeClassName='active'
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
                to={`/laundries/${laundry.id}/settings`} activeClassName='active'
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
      {this._renderTour()}
      {this.renderContent(user)}
    </div>
  }

  _renderTour () {
    if (!this.state.tour) {
      return null
    }
    const laundry = this.laundry()
    if (!laundry) {
      return null
    }
    return (
      <Tour onClose={this._onStopTour}>
        <TourStep title={'Create machines'} completed={!!laundry.machines.length}>
          Start by creating some machines for your laundry.
        </TourStep>
        <TourStep title={'Invite users'} >
          Plz invite some users
        </TourStep>
        <TourStep title={'Set booking rules'}>
          Plz set rules!? Optional
        </TourStep>
      </Tour>
    )
  }

  _onStartTour = () => this.setState({tour: true})
  _onStopTour = () => this.setState({tour: false})

  _renderTimeTable = props => (
    <Timetable {...props} touring={this.state.tour} onStartTour={this._onStartTour} />
  )

  renderContent (user: User) {
    const laundry = this.laundry()
    return (
      <Switch>
        <Redirect exact from={'/laundries/:laundryId'} to={`/laundries/${this.laundry().id}/timetable`} />
        <Route path={'/laundries/:laundryId/timetable'} render={this._renderTimeTable} />
        <Route path={'/laundries/:laundryId/bookings'} component={Bookings} />
        <Route path={'/laundries/:laundryId/settings'} component={LaundrySettings} />
        <OwnerCheckRoute
          user={user}
          laundry={laundry}
          render={props => <Machines {...props} />}
          path={'/laundries/:laundryId/machines'} />
        <OwnerCheckRoute
          user={user}
          laundry={laundry}
          render={props => <Users {...props} />}
          path={'/laundries/:laundryId/users'} />
        <Route component={NotFound} />
      </Switch>
    )
  }

  load () {
    return sdk.fetchLaundry(this.props.currentLaundry)
  }

  render () {
    const user = this.props.user
    if (!user) {
      return <NotFound />
    }
    if (user.role !== 'admin' && user.laundries.indexOf(this.props.currentLaundry) < 0) {
      return <NotFound />
    }
    return <Loader loader={() => this.load()} loaded={Boolean(this.laundry())}>
      {this.renderNav(user)}
    </Loader>
  }
}

export default connect(({users, laundries, currentUser}: State, {match: {params: {laundryId}}}): LeftNavProps => ({
  laundries,
  currentLaundry: laundryId,
  user: (currentUser && users[currentUser]) || null
}))(LeftNav)
