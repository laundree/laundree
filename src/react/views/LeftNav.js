// @flow
import React from 'react'
import { NavLink } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import Loader from './Loader'
import sdk from '../../client/sdk'
import NotFound from '../views/NotFound'
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

type Pos = { top: number, left: number }

type NavFunction = () => void

type TourElementProps = {
  onNext?: NavFunction,
  onPrev?: NavFunction,
  onPositionChange: (p: ?Pos) => void,
  children?: *,
  title: string,
  render?: (prev: NavFunction, next: NavFunction) => *, // TODO find type
  linkRef: *
}

class TourStep<T: {}> extends React.PureComponent<TourElementProps & T> {
  _updatePosition () {
    const ref = this.props.linkRef
    if (!ref) {
      return
    }
    const {top, right} = ref.getBoundingClientRect()
    this.props.onPositionChange({top: top, left: right})
  }

  componentDidMount () {
    this._updatePosition()
  }

  componentWillReceiveProps ({linkRef}) {
    if (linkRef === this.props.linkRef) {
      return
    }
    this._updatePosition()
  }

  _renderContent () {
    if (this.props.children) {
      return this.props.children
    }
    const {onPrev, onNext, render} = this.props
    if (!onPrev || !onNext || !render) return null
    return render(onPrev, onNext)
  }

  render () {
    return (
      <div>{this._renderContent()}</div>
    )
  }
}

class Tour extends React.PureComponent<{ children: *, onClose: () => * }, { step: number, position: ?Pos }> {
  state = {step: 0}
  _onNext = () => this.setState(({step}) => ({step: step + 1, position: null}))
  _onPrev = () => this.setState(({step}) => ({step: step - 1, position: null}))

  _navContainerStyle = {
    position: 'absolute',
    zIndex: 400,
    backgroundColor: '#aaa',
    bottom: 0,
    width: '100%'
  }

  _navStyle = {
    padding: '1em 1em',
    color: '#fff'
  }

  _buttonStyle = {
    display: 'inline-block'
  }

  _cardStyle = {
    position: 'absolute',
    backgroundColor: '#fff',
    zIndex: 400,
    padding: '2em 1em',
    borderRadius: '0.3em'
  }

  _onPositionChange = position => this.setState({position})

  render () {
    const children = React.Children.toArray(this.props.children)
    const child = children[0]
    if (!child) {
      return null
    }
    return (
      <div>
        <div style={{...this._cardStyle, ...(this.state.position || {display: 'none'})}}>
          {React.cloneElement(child, {
            onNext: this._onNext,
            onPrev: this._onPrev,
            onPositionChange: this._onPositionChange
          })}
        </div>
        <div style={this._navContainerStyle}>
          <div style={this._navStyle}>
            <div style={{float: 'right'}}>
              <button
                onClick={this.props.onClose}
                style={this._buttonStyle}
                className={'red'}>
                Stop tour
              </button>
            </div>
            <span style={{padding: '0 2em'}}>
              {child.props.title} (Step {this.state.step + 1} of {children.length})
            </span>
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

  _machineRef

  _machineRefPuller = ref => {
    this._machineRef = ref
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
    return (
      <Tour onClose={this._onStopTour}>
        <TourStep title={'Create machines'} linkRef={this._machineRef}>
          <div>
            <b>Create machines</b>
            <div>
              Start by creating some machines for your laundry.
            </div>
          </div>
        </TourStep>
        <TourStep title={'Set booking rules'} />
        <TourStep title={'Invite users'} />
      </Tour>
    )
  }

  _onStartTour = () => this.setState({tour: true})
  _onStopTour = () => this.setState({tour: false})

  _renderTimeTable = props => (
    <Timetable {...props} onStartTour={this._onStartTour} />
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
