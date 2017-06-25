// @flow
import React from 'react'
import { DocumentTitle } from './intl'
import TimetableTables from './TimetableTables'
import TimetableHeaders from './TimetableHeaders'
import { Link } from 'react-router-dom'
import { FormattedDate, FormattedMessage } from 'react-intl'
import { range } from '../../utils/array'
import sdk from '../../client/sdk'
import moment from 'moment-timezone'
import { BaseModal } from './modal'
import Loader from './Loader'
import type { Machine, User, Booking, Laundry } from 'laundree-sdk/lib/redux'

class BookingInfo extends React.Component {
  props: {
    onActiveChange: Function,
    currentUser: string,
    offsetDate: string,
    laundry: Laundry,
    booking: Booking,
    machines: { [string]: Machine },
    users: { [string]: User }
  }

  deleteHandler = async () => {
    await sdk
      .api
      .booking
      .del(this.props.booking.id)
    this.close()
  }

  closeHandler = () => this.close()

  renderActions () {
    if (!this.isOwner()) return null
    return <button className='red' onClick={this.deleteHandler}>
      <FormattedMessage id='general.delete-booking' />
    </button>
  }

  isOwner () {
    return this.props.booking.owner === this.props.currentUser || this.props.laundry.owners.indexOf(this.props.currentUser) >= 0
  }

  renderBooking () {
    const booking = this.props.booking
    if (!booking) return null
    const owner = this.props.users[booking.owner]
    const fromDate = new Date(booking.from)
    const toDate = new Date(booking.to)
    const sameDay = new Date(fromDate.getTime()).setHours(0, 0, 0, 0) === new Date(toDate.getTime()).setHours(0, 0, 0, 0)
    const today = new Date().setHours(0, 0, 0, 0) === new Date(fromDate.getTime()).setHours(0, 0, 0, 0)
    return <div id='ActiveBooking'>
      <img src={owner.photo} className='avatar' />
      <div className='text'>
        <FormattedMessage
          id={owner.id === this.props.currentUser
            ? 'timetable.modal.message.you-have'
            : 'timetable.modal.message.user-has'}
          values={{
            machine: <i>{this.props.machines[this.props.booking.machine].name}</i>,
            fromTime: <FormattedDate
              timeZone={this.props.laundry.timezone}
              weekday={today ? undefined : 'long'}
              month={today ? undefined : 'numeric'}
              day={today ? undefined : 'numeric'}
              hour='numeric'
              minute='numeric'
              value={this.props.booking.from} />,
            toTime: <FormattedDate
              timeZone={this.props.laundry.timezone}
              weekday={sameDay ? undefined : 'long'}
              month={sameDay ? undefined : 'numeric'}
              day={sameDay ? undefined : 'numeric'}
              hour='numeric'
              minute='numeric'
              value={this.props.booking.to} />,
            user: owner.displayName
          }}
        />
      </div>
      <div className='buttonContainer'>
        {this.renderActions()}
        <button onClick={this.closeHandler}>
          <FormattedMessage id='general.close' />
        </button>
      </div>
    </div>
  }

  close () {
    this.props.onActiveChange(null)
  }

  render () {
    return <BaseModal
      onClose={this.closeHandler}
      show={Boolean(this.props.booking)}>
      {this.renderBooking()}
    </BaseModal>
  }
}
type TimetableProps = {
  currentUser: string,
  offsetDate: string,
  users: { [string]: User },
  machines: { [string]: Machine },
  bookings: { [string]: Booking },
  laundry: Laundry
}

class Timetable extends React.Component {
  state = {numDays: 0, offset: 0, hoverColumn: -1, activeBooking: null}
  _mainRef: HTMLElement
  props: TimetableProps

  refPuller = (ref: HTMLElement) => {
    this._mainRef = ref
  }

  handleResize () {
    this.setState({numDays: this.numDays()})
  }

  componentDidMount () {
    window.addEventListener('resize', () => this.handleResize())
    const numDays = this.numDays()
    this.setState({numDays})
  }

  componentWillReceiveProps ({laundry: {machines: machineIds}, machines}) {
    if (machineIds.length !== this.props.laundry.machines.length) this.setState({numDays: this.calculateNumDays(machineIds.length)})
    if (!this._mainRef || machineIds.map(id => machines[id]).filter(m => m).length !== machineIds.length) return
    if (!this._mainRef.offsetHeight || this.state.scrolledToNav) return
    const now = this._mainRef.querySelector('#TimeTable .now')
    this.setState({scrolledToNav: true})
    if (!now) return
    now.scrollIntoView()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', () => this.handleResize())
  }

  numDays () {
    return this.calculateNumDays(this.props.laundry.machines.length)
  }

  calculateNumDays (numMachines: number) {
    if (!this._mainRef) return 0
    return Math.min(Math.max(Math.floor(this._mainRef.offsetWidth / (Math.max(numMachines * 100, 200))), 1), 7)
  }

  offsetDate () {
    return this.props.offsetDate && this.props.offsetDate.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) && moment.tz(this.props.offsetDate, this.props.laundry.timezone).isValid()
      ? this.props.offsetDate
      : undefined
  }

  days () {
    const startDay = this.offsetDate()
      ? moment.tz(this.offsetDate(), this.props.laundry.timezone)
      : moment.tz(moment.tz(this.props.laundry.timezone).format('YYYY-MM-DD'), this.props.laundry.timezone)
    return range(this.state.numDays).map(i => startDay.clone().add(i, 'd'))
  }

  render () {
    const days = this.days()
    const offsetDate = this.offsetDate()
    return <main id='TimeTableMain' ref={this.refPuller}>
      <TimetableHeaders
        hoverColumn={this.state.hoverColumn}
        laundry={this.props.laundry} dates={days} machines={this.props.machines} />
      <TimetableTables
        onActiveChange={activeBooking => this.setState({activeBooking})}
        currentUser={this.props.currentUser}
        activeBooking={this.state.activeBooking}
        offsetDate={offsetDate}
        onHoverColumn={hoverColumn => this.setState({hoverColumn})}
        hoverColumn={this.state.hoverColumn}
        bookings={this.props.bookings}
        laundry={this.props.laundry} dates={days} machines={this.props.machines} />
      <BookingInfo
        onActiveChange={activeBooking => this.setState({activeBooking})}
        currentUser={this.props.currentUser}
        users={this.props.users}
        laundry={this.props.laundry}
        offsetDate={offsetDate}
        booking={this.props.bookings[this.state.activeBooking || '']}
        machines={this.props.machines}/>
    </main>
  }
}

export default class TimetableWrapper extends React.Component {
  props: TimetableProps

  renderEmpty () {
    return <main className='naved'>
      <h1 className='alignLeft'>
        <FormattedMessage id='timetable.no-machines.title' />
      </h1>
      {this.isOwner() ? <section>
        <FormattedMessage
          id='timetable.no-machines.action.register'
          values={{
            link: <Link to={'/laundries/' + this.props.laundry.id + '/machines'}>
              <FormattedMessage id='timetable.no-machines.action.register.link'/>
            </Link>
          }}/>
      </section> : <section>
        <FormattedMessage id='timetable.no-machines.action.wait'/>
      </section>}
    </main>
  }

  load () {
    return sdk.listMachinesAndUsers(this.props.laundry.id)
  }

  isOwner () {
    return this.props.laundry.owners.indexOf(this.props.currentUser) >= 0
  }

  renderTables () {
    return <Timetable
      users={this.props.users}
      currentUser={this.props.currentUser}
      offsetDate={this.props.offsetDate}
      machines={this.props.machines}
      bookings={this.props.bookings}
      laundry={this.props.laundry}
    />
  }

  render () {
    return <DocumentTitle title='document-title.timetable'>
      <Loader loader={() => this.load()}>
        {this.props.laundry.machines.length ? this.renderTables() : this.renderEmpty()}
      </Loader>
    </DocumentTitle>
  }
}
