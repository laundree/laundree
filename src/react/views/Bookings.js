// @flow
import React from 'react'
import { Link } from 'react-router-dom'
import { Modal, DocumentTitle } from './intl'
import sdk from '../../client/sdk'
import { FormattedMessage, FormattedDate } from 'react-intl'
import moment from 'moment'
import Loader from './Loader'

class BookingComponent extends React.Component {
  onCloseModal = () => this.setState({showModal: false})
  onDeleteModal = () => sdk.api.booking.del(this.props.booking.id)
  onDeleteClick = () => this.setState({showModal: true})
  state: { showModal: boolean } = {showModal: false}
  props: {
    laundry: Laundry,
    machine: Machine,
    booking: Booking
  }

  render () {
    const booking = this.props.booking
    const fromDate = new Date(booking.from)
    const toDate = new Date(booking.to)
    const sameDay = new Date(fromDate.getTime()).setHours(0, 0, 0, 0) === new Date(toDate.getTime()).setHours(0, 0, 0, 0)
    const today = new Date().setHours(0, 0, 0, 0) === new Date(fromDate.getTime()).setHours(0, 0, 0, 0)
    return <div>
      <Modal
        show={this.state.showModal}
        message='bookings.modal.delete-booking'
        onClose={this.onCloseModal}
        actions={[
          {label: 'general.delete', className: 'delete red', action: this.onDeleteModal},
          {label: 'general.cancel', className: 'cancel', action: this.onCloseModal}]}
      />
      <div className='machineName'>
        <Link
          to={`/laundries/${this.props.laundry.id}/timetable?offsetDate=${moment(fromDate).format('YYYY-MM-DD')}`}>
          {this.props.machine.name}
        </Link>
      </div>
      <div className='time_action_wrapper'>
        <div className='time'>
          <svg>
            <use xlinkHref='#Time' />
          </svg>
          <FormattedDate
            weekday={today ? undefined : 'long'}
            timeZone={this.props.laundry.timezone}
            month={today ? undefined : 'numeric'} day={today ? undefined : 'numeric'} hour='numeric' minute='numeric'
            value={booking.from} />
          <FormattedDate
            timeZone={this.props.laundry.timezone}
            weekday={sameDay ? undefined : 'long'} month={sameDay ? undefined : 'numeric'}
            day={sameDay ? undefined : 'numeric'} hour='numeric' minute='numeric'
            value={booking.to} />
        </div>
        <svg className='trash' onClick={this.onDeleteClick}>
          <use xlinkHref='#Trash' />
        </svg>
      </div>
    </div>
  }
}

export default class Bookings extends React.Component {
  state: { showModal: boolean } = {showModal: false}
  props: {
    laundry: Laundry,
    user: User,
    userBookings: string[],
    bookings: { [string]: Booking },
    machines: { [string]: Machine }
  }
  onCloseModal = () => this.setState({showModal: false})

  renderBookings () {
    if (!this.props.userBookings) return null
    const bookings = this.props.userBookings.map(bookingId => this.renderBooking(this.props.bookings[bookingId])).filter(b => b)
    if (!bookings.length) {
      return <div className='empty_list'>
        <FormattedMessage id='bookings.no-bookings' />
      </div>
    }
    return <ul>
      {bookings}
    </ul>
  }

  renderBooking (booking: Booking) {
    const machine = this.props.machines[booking.machine]
    if (!machine || machine.broken) {
      return null
    }
    return <li key={booking.id}>
      <BookingComponent
        laundry={this.props.laundry}
        machine={this.props.machines[booking.machine]}
        booking={booking} />
    </li>
  }

  load () {
    return Promise.all([
      sdk.listBookingsForUser(this.props.laundry.id, this.props.user.id, {to: {$gte: new Date()}}),
      sdk.listMachines(this.props.laundry.id)
    ])
  }

  render () {
    return <DocumentTitle title='document-title.bookings'>
      <Loader loader={() => this.load()}>
        <main className='naved'>
          <h1 className='alignLeft'>
            <FormattedMessage id='bookings.title' />
          </h1>
          <section id='BookingList'>
            {this.renderBookings()}
          </section>
        </main>
      </Loader>
    </DocumentTitle>
  }
}
