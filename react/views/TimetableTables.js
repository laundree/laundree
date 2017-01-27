/**
 * Created by budde on 28/05/16.
 */
const React = require('react')
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
  }

  _row (key, tooLate) {
    const machines = this.props.laundry.machines
      .map(id => this.props.machines[id])
      .filter(m => m)
    return <tr
      key={key}
      className={(tooLate ? 'too_late' : '') + (this.props.hoverRow === key ? ' hover' : '')}>
      {machines
        .map(m => {
          const isBooked = this.isBooked(m.id, key)
          if (!isBooked || m.broken) {
            return <td key={m.id} className={m.broken ? 'broken' : ''}/>
          }
          return <td key={m.id}>
            {this.createBookingLink(isBooked)}
          </td>
        })}
    </tr>
  }

  generateActiveChangeHandler (bookingId) {
    return () => this.props.onActiveChange(bookingId)
  }

  createBookingLink (bookingId) {
    const active = this.isActive(bookingId)
    const mine = this.isMine(bookingId)
    return <span
      onClick={this.generateActiveChangeHandler(bookingId)}
      className={'booking' + (active ? ' active' : '') + (mine ? ' mine' : '')}/>
  }

  isMine (bookingId) {
    const booking = this.props.bookings[bookingId]
    return this.props.currentUser === booking.owner
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
    const nowBox = now.hours() * 2 + now.minutes() / 30 + this.dayCoefficient(now) * 48
    const startBox = this.props.times[0]
    const lastBox = this.props.times[this.props.times.length - 1]
    const boxLength = lastBox + 1 - startBox
    const percent = (nowBox - startBox) / boxLength
    const offLimitsPosition = percent + 1 / (3 * boxLength)
    return {nowPosition: percent * 100, offLimitsPosition: maxMin(offLimitsPosition, 1, 0) * 100}
  }

  handleMouseDown (event) {
    switch (event.target.tagName.toLowerCase()) {
      case 'td':
        const td = event.target
        this._mouseDownStart = this.tdToTablePos(td)
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
        const to = this.tdToTablePos(td)
        this.book(this._mouseDownStart, to)
    }
  }

  tdToTablePos (td) {
    return {x: td.cellIndex, y: td.parentNode.rowIndex + this.props.times[0]}
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
      .map(x => {
        const machine = this.props.machines[this.props.laundry.machines[x]]
        if (machine.broken) return
        return sdk.machine(machine.id).createBooking(this.posToDate(min), this.posToDate(maxExclusive))
      }))
  }

  static _fixPos (pos1, pos2) {
    return {
      min: {x: Math.min(pos1.x, pos2.x), y: Math.min(pos1.y, pos2.y)},
      max: {x: Math.max(pos1.x, pos2.x), y: Math.max(pos1.y, pos2.y)}
    }
  }

  handleMouseOut () {
    this.hover({x: -1, y: -1})
  }

  hover ({x, y}) {
    this.props.onHoverRow(y)
    this.props.onHoverColumn(x)
  }

  hoverTd (td) {
    this.hover(this.tdToTablePos(td))
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

  calculateTooLateKey (tooLate) {
    return 48 * this.dayCoefficient(tooLate) + tooLate.hours() * 2 + tooLate.minutes() / 30
  }

  dayCoefficient (moment) {
    if (this.props.date.isBefore(moment, 'd')) return 1
    if (this.props.date.isAfter(moment, 'd')) return -1
    return 0
  }

  render () {
    const now = moment().tz(this.props.laundry.timezone)
    const time = now.format('H:mm')
    const tooLate = now.clone().add(10, 'm')
    const tooLateKey = this.calculateTooLateKey(tooLate)
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
        onMouseOver={event => this.handleMouseOver(event)}
        onMouseOut={event => this.handleMouseOut(event)}
        onMouseDown={event => this.handleMouseDown(event)}
        onMouseUp={event => this.handleMouseUp(event)}>
        <tbody>
        {this.props.times.map((key) => this._row(key, tooLateKey >= key))}
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
  onActiveChange: React.PropTypes.func,
  offsetDate: React.PropTypes.string,
  date: React.PropTypes.object.isRequired,
  onHoverRow: React.PropTypes.func.isRequired,
  hoverRow: React.PropTypes.number.isRequired,
  times: React.PropTypes.arrayOf(React.PropTypes.number).isRequired
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

  get times () {
    if (!this.props.laundry.rules.timeLimit) return range(48)
    const {hour: fromHour, minute: fromMinute} = this.props.laundry.rules.timeLimit.from
    const {hour: toHour, minute: toMinute} = this.props.laundry.rules.timeLimit.to
    const from = Math.floor(fromHour * 2 + fromMinute / 30)
    const to = Math.floor(toHour * 2 + toMinute / 30)
    return range(from, to)
  }

  render () {
    const times = this.times
    const halfStart = times[0] % 2
    const hours = (halfStart ? times : times.slice(2)).filter(i => (i + 1) % 2).map(i => i / 2)
    const timeList = <ul className={'times' + (halfStart ? ' half' : '')}>
      {hours.map(h => <li key={h}><span>{h}</span></li>)}
    </ul>
    return <section id='TimeTable'>
      <div className='timetable_container'>
        {timeList}
        {this.props.dates.map((date, i) => <TimetableTable
          currentUser={this.props.currentUser}
          offsetDate={this.props.offsetDate}
          onActiveChange={this.props.onActiveChange}
          activeBooking={this.props.activeBooking}
          hoverRow={this.state.hoverRow}
          onHoverRow={this.hoverRowHandler}
          onHoverColumn={this.hoverColumnWrapper(i)}
          date={date} machines={this.props.machines} laundry={this.props.laundry}
          bookings={this.props.bookings}
          times={times}
          key={date.format('YYYY-MM-DD')}/>)}
        {timeList}
      </div>
    </section>
  }
}

TimetableTables.propTypes = {
  onActiveChange: React.PropTypes.func,
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
