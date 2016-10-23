/**
 * Created by budde on 28/05/16.
 */
const Promise = require('promise')
const React = require('react')
const {Link} = require('react-router')
const {range} = require('../../utils/array')
const sdk = require('../../client/sdk')
const moment = require('moment-timezone')

function maxMin (value, max, min) {
  return Math.max(Math.min(value, max), min)
}

class TimetableTable extends React.Component {

  constructor (props) {
    super(props)
    this.state = Object.assign({bookings: {}, activeBooking: null}, this._calcPosition())
    this.firstBooking = false
    this.tableMouseDownHandler = (event) => this.handleMouseDown(event)
    this.tableMouseUpHandler = (event) => this.handleMouseUp(event)
    this.tableMouseOverHandler = (event) => this.handleMouseOver(event)
    this.tableMouseOutHandler = (event) => this.handleMouseOut(event)
  }

  _row (key, tooLate) {
    const machines = this.props.laundry.machines
      .map((id) => this.props.machines[id])
      .filter((m) => m)
    return <tr
      key={key}
      className={(tooLate ? 'too_late' : '') + (this.props.hoverRow === key ? ' hover' : '')}>
      {machines
        .map((m) => {
          const isBooked = this.isBooked(m.id, key)
          if (!isBooked) return <td key={m.id}/>
          return <td key={m.id}>
            {this.createBookingLink(isBooked)}
          </td>
        })}
    </tr>
  }

  createBookingLink (bookingId) {
    const active = this.isActive(bookingId)
    const link = this.bookingLink(bookingId)
    const mine = this.isMine(bookingId)
    return <Link
      to={link}
      className={'booking' + (active ? ' active' : '') + (mine ? ' mine' : '')}/>
  }

  isMine (bookingId) {
    const booking = this.props.bookings[bookingId]
    return this.props.currentUser === booking.owner
  }

  bookingLink (bookingId) {
    const query = [bookingId ? `activeBooking=${bookingId}` : null, this.props.offsetDate ? `offsetDate=${this.props.offsetDate}` : null].filter((p) => p).join('&')
    return `/laundries/${this.props.laundry.id}/timetable${query ? '?' + query : ''}`
  }

  componentDidMount () {
    this._interval = setInterval(() => this.tick(), 60 * 1000)
  }

  componentWillUnmount () {
    clearInterval(this._interval)
  }

  componentWillReceiveProps ({bookings}) {
    const day = this.props.date.clone()
    this.setState({
      bookings: Object.keys(bookings)
        .map((key) => bookings[key])
        .map(({from, to, machine, id}) => ({
          from: moment(from).tz(this.props.laundry.timezone),
          to: moment(to).tz(this.props.laundry.timezone),
          machine,
          id
        }))
        .filter(({from, to}) => to.isSameOrAfter(day, 'd') && from.isSameOrBefore(day, 'd'))
        .reduce((obj, {machine, from, to, id}) => {
          const fromY = day.isSame(from, 'd') ? TimetableTable.dateToY(from) : 0
          const toY = day.isSame(to, 'd') ? TimetableTable.dateToY(to) : 48
          range(fromY, toY).forEach((y) => {
            obj[`${machine}:${y}`] = id
          })
          return obj
        }, {})
    })
  }

  componentDidUpdate () {
    if (this.firstBooking) return
    this.firstBooking = true
    const ref = this.ref.querySelector('.booking.active')
    if (!ref) return
    ref.scrollIntoView()
  }

  isBooked (x, y) {
    return this.state.bookings[`${x}:${y}`]
  }

  isActive (bookingId) {
    return this.props.activeBooking === bookingId
  }

  tick () {
    this.setState(this._calcPosition())
  }

  _calcPosition () {
    const now = moment().tz(this.props.laundry.timezone)
    const diff = now.valueOf() - this.props.date.clone().valueOf()
    const percent = diff / (24 * 60 * 60 * 1000)
    const offLimitsPosition = percent + (10 / (60 * 24))
    return {nowPosition: percent * 100, offLimitsPosition: maxMin(offLimitsPosition, 1, 0) * 100}
  }

  handleMouseDown (event) {
    switch (event.target.tagName.toLowerCase()) {
      case 'td':
        const td = event.target
        this._mouseDownStart = TimetableTable.tdToTablePos(td)
        break
      default:
        this._mouseDownStart = undefined
    }
  }

  handleMouseUp (event) {
    if (!this._mouseDownStart) return
    switch (event.target.tagName.toLowerCase()) {
      case 'td':
        const td = event.target
        const to = TimetableTable.tdToTablePos(td)
        this.book(this._mouseDownStart, to)
    }
  }

  static tdToTablePos (td) {
    return {x: td.cellIndex, y: td.parentNode.rowIndex}
  }

  static dateToY (date) {
    return Math.floor((date.hours() * 60 + date.minutes()) / 30)
  }

  posToDate ({y}) {
    const mins = y * 30
    return {
      year: this.props.date.year(),
      month: this.props.date.month(),
      day: this.props.date.date(),
      hour: Math.floor(mins / 60),
      minute: mins % 60
    }
  }

  book (from, to) {
    const {max, min} = TimetableTable._fixPos(from, to)
    const maxExclusive = {x: max.x + 1, y: max.y + 1}
    return Promise.all(range(min.x, maxExclusive.x)
      .map((x) => sdk.machine(this.props.laundry.machines[x]).createBooking(this.posToDate(min), this.posToDate(maxExclusive))))
  }

  static _fixPos (pos1, pos2) {
    return {
      min: {x: Math.min(pos1.x, pos2.x), y: Math.min(pos1.y, pos2.y)},
      max: {x: Math.max(pos1.x, pos2.x), y: Math.max(pos1.y, pos2.y)}
    }
  }

  handleMouseOut () {
    this.hover(-1, -1)
  }

  hover (x, y) {
    this.props.onHoverRow(y)
    this.props.onHoverColumn(x)
  }

  hoverTd (td) {
    this.hover(td.cellIndex, td.parentNode.rowIndex)
  }

  handleMouseOver (event) {
    switch (event.target.tagName.toLowerCase()) {
      case 'td':
        this.hoverTd(event.target)
        break
      default:
        this.handleMouseOut()
    }
  }

  render () {
    const now = moment().tz(this.props.laundry.timezone)
    const time = now.format('H:mm')
    const today = now.isSame(this.props.date, 'd')
    var tooLateKey
    if (today) {
      const tooLate = now.clone().add(10, 'm')
      tooLateKey = tooLate.hours() * 2 + tooLate.minutes() / 30
    }
    const refPuller = (ref) => {
      this.ref = ref
    }
    return <div className='overlay_container' ref={refPuller}>
      <div className='overlay'>
        <div className='off_limits' style={{height: this.state.offLimitsPosition + '%'}}/>
        {this.state.nowPosition > 0 && this.state.nowPosition < 100
          ? <div className='now' style={{top: this.state.nowPosition + '%'}} data-time={time}/> : ''}
      </div>
      <table
        onMouseOver={this.tableMouseOverHandler}
        onMouseOut={this.tableMouseOutHandler}
        onMouseDown={this.tableMouseDownHandler}
        onMouseUp={this.tableMouseUpHandler}>
        <tbody>
        {range(48).map((key) => this._row(key, today && tooLateKey >= key))}
        </tbody>
      </table>
    </div>
  }
}

TimetableTable.propTypes = {
  currentUser: React.PropTypes.string.isRequired,
  onHoverColumn: React.PropTypes.func.isRequired,
  machines: React.PropTypes.object.isRequired,
  laundry: React.PropTypes.object.isRequired,
  bookings: React.PropTypes.object.isRequired,
  activeBooking: React.PropTypes.string,
  offsetDate: React.PropTypes.string,
  date: React.PropTypes.object.isRequired,
  onHoverRow: React.PropTypes.func.isRequired,
  hoverRow: React.PropTypes.number.isRequired
}

class TimetableTables extends React.Component {

  constructor (props) {
    super(props)
    this.state = {hoverRow: -1}
    this.hoverRowHandler = (row) => this.setState({hoverRow: row})
  }

  componentWillReceiveProps ({dates, laundry: {id}}) {
    const oldDates = this.props.dates
    if (dates.length === oldDates.length && oldDates.every((d, i) => d.isSame(dates[i], 'd'))) return
    const firstDate = dates[0]
    const lastDate = dates[dates.length - 1]
    const lastDateExclusive = lastDate.clone().add(1, 'd')
    sdk.listBookingsInTime(id, {
      year: firstDate.year(),
      month: firstDate.month(),
      day: firstDate.date()
    }, {
      year: lastDateExclusive.year(),
      month: lastDateExclusive.month(),
      day: lastDateExclusive.date()
    })
  }

  hoverColumnWrapper (i) {
    return (j) => this.props.onHoverColumn(j < 0 ? -1 : (i * this.props.laundry.machines.length + j))
  }

  render () {
    return <section id='TimeTable'>
      <div className='timetable_container'>
        <ul className='times'>
          <li><span>1</span></li>
          <li><span>2</span></li>
          <li><span>3</span></li>
          <li><span>4</span></li>
          <li><span>5</span></li>
          <li><span>6</span></li>
          <li><span>7</span></li>
          <li><span>8</span></li>
          <li><span>9</span></li>
          <li><span>10</span></li>
          <li><span>11</span></li>
          <li><span>12</span></li>
          <li><span>13</span></li>
          <li><span>14</span></li>
          <li><span>15</span></li>
          <li><span>16</span></li>
          <li><span>17</span></li>
          <li><span>18</span></li>
          <li><span>19</span></li>
          <li><span>20</span></li>
          <li><span>21</span></li>
          <li><span>22</span></li>
          <li><span>23</span></li>
        </ul>
        {this.props.dates.map((date, i) => <TimetableTable
          currentUser={this.props.currentUser}
          offsetDate={this.props.offsetDate}
          activeBooking={this.props.activeBooking}
          hoverRow={this.state.hoverRow}
          onHoverRow={this.hoverRowHandler}
          onHoverColumn={this.hoverColumnWrapper(i)}
          date={date} machines={this.props.machines} laundry={this.props.laundry}
          bookings={this.props.bookings}
          key={date.format('YYYY-MM-DD')}/>)}
        <ul className='times'>
          <li><span>1</span></li>
          <li><span>2</span></li>
          <li><span>3</span></li>
          <li><span>4</span></li>
          <li><span>5</span></li>
          <li><span>6</span></li>
          <li><span>7</span></li>
          <li><span>8</span></li>
          <li><span>9</span></li>
          <li><span>10</span></li>
          <li><span>11</span></li>
          <li><span>12</span></li>
          <li><span>13</span></li>
          <li><span>14</span></li>
          <li><span>15</span></li>
          <li><span>16</span></li>
          <li><span>17</span></li>
          <li><span>18</span></li>
          <li><span>19</span></li>
          <li><span>20</span></li>
          <li><span>21</span></li>
          <li><span>22</span></li>
          <li><span>23</span></li>
        </ul>
      </div>
    </section>
  }
}

TimetableTables.propTypes = {
  currentUser: React.PropTypes.string.isRequired,
  activeBooking: React.PropTypes.string,
  offsetDate: React.PropTypes.string,
  onHoverColumn: React.PropTypes.func.isRequired,
  dates: React.PropTypes.array.isRequired,
  laundry: React.PropTypes.object.isRequired,
  machines: React.PropTypes.object.isRequired,
  bookings: React.PropTypes.object.isRequired
}

module.exports = TimetableTables
