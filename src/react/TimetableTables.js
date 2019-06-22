// @flow
import React from 'react'
import { range } from '../utils/array'
import sdk from '../client/sdk'
import moment from 'moment-timezone'
import type { Machine, Laundry, Booking } from 'laundree-sdk/lib/redux'
import ReactGA from 'react-ga'

function maxMin (value, max, min) {
  return Math.max(Math.min(value, max), min)
}

/**
 *
 * @param parent
 * @param child
 * @return {boolean}
 */
function isChildOf (parent, child) {
  if (!child.parentNode) return false
  if (child.parentNode === parent) return true
  return isChildOf(parent, child.parentNode)
}

type TimetableTableProps = {
  currentUser: string,
  onHoverColumn: Function,
  machines: { [string]: Machine },
  laundry: Laundry,
  bookings: { [string]: Booking },
  activeBooking: ?string,
  onActiveChange: Function,
  offsetDate?: string,
  date: moment,
  onHoverRow: Function,
  hoverRow: number,
  hoverColumn: number,
  times: number[]
}

type MouseDownStartState = { x: number, y: number, yCorrection?: number, bookingFromY?: number, bookingToY?: number, resizeId?: string }

class TimetableTable extends React.Component<TimetableTableProps, {
  activeBooking: ?string,
  nowPosition: number,
  offLimitsPosition: number,
  mouseDownStart: ?MouseDownStartState,
  bookings: { [string]: string }
  }> {
  props: TimetableTableProps
  firstBooking = false
  state = {...this._calcPosition(), bookings: {}, activeBooking: null, mouseDownStart: null}
  _interval: number
  bodyListener: Function
  bodyRef: HTMLElement
  ref: ?HTMLElement
  tableRef: ?HTMLTableElement

  _row (key, tooLate) {
    const machines = this.props.laundry.machines
      .map(id => this.props.machines[id])
      .filter(m => m)
    return <tr
      key={key}
      className={(tooLate ? 'too_late' : '') + (this.props.hoverRow === key ? ' hover' : '')}>
      {machines
        .map((m, i) => {
          if (m.broken) {
            return <td key={m.id} className='broken'/>
          }
          const isBooked = this.isBooked(m.id, key)
          const resizeId = this.state.mouseDownStart && this.state.mouseDownStart.resizeId
          const yCorrection = (this.state.mouseDownStart && this.state.mouseDownStart.yCorrection) || 0
          if (isBooked) {
            return <td
              key={m.id}
              className={(this.isSelecting(i, key + (yCorrection * -1)) ? 'selecting' : '') + (resizeId === isBooked ? ' resizing' : '')}>
              {this.createBookingLink(isBooked)}
              {this.createResizer(isBooked, this.isBooked(m.id, key - 1), this.isBooked(m.id, key + 1))}
            </td>
          }
          return <td key={m.id} className={this.isSelecting(i, key) ? 'selecting' : ''}/>
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

  createResizer (bookingId, prevBookingId, nextBookingId) {
    const mine = this.isMine(bookingId)
    if (!mine) {
      return null
    }
    const children = []
    if (bookingId !== prevBookingId) {
      children.push(<span
        key='top'
        onClick={this.generateActiveChangeHandler(bookingId)}
        data-id={bookingId}
        className={'resizer top'}/>)
    }
    if (bookingId !== nextBookingId) {
      children.push(<span
        key='bottom'
        data-id={bookingId}
        onClick={this.generateActiveChangeHandler(bookingId)}
        className={'resizer bottom'}/>)
    }
    return children
  }

  isMine (bookingId) {
    const booking = this.props.bookings[bookingId]
    return this.props.currentUser === booking.owner
  }

  componentDidMount () {
    this._interval = setInterval(() => this.tick(), 60 * 1000)
    this.bodyListener = evt => {
      if (!this.state.mouseDownStart) return
      if (!this.tableRef) return
      if (isChildOf(this.tableRef, evt.target)) return
      this.setState({mouseDownStart: null})
    }
    this.bodyRef = window.document.querySelector('body')
    this.bodyRef.addEventListener('mouseup', this.bodyListener)
  }

  componentWillUnmount () {
    clearInterval(this._interval)
    this.bodyRef.removeEventListener('mouseover', this.bodyListener)
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
          const fromY = this.dateToY(from, 0)
          const toY = this.dateToY(to, 48)
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
    const ref = this.ref && this.ref.querySelector('.booking.active')
    if (!ref) return
    ref.scrollIntoView()
  }

  isBooked (machine, row) {
    return this.state.bookings[`${machine}:${row}`]
  }

  isSelecting (x, y) {
    if (!this.state.mouseDownStart || this.props.hoverRow < 0 || this.props.hoverColumn < 0) {
      return false
    }
    const {yCorrection, x: mouseX, y: mouseY, bookingFromY, bookingToY, resizeId} = this.state.mouseDownStart
    const hoverX = this.props.hoverColumn
    const hoverY = this.props.hoverRow
    if (resizeId && (((yCorrection || 0) < 0 && hoverY >= (bookingToY || 0)) || ((yCorrection || 0) > 0 && hoverY < (bookingFromY || 0)))) {
      return false
    }
    return x >= Math.min(mouseX, hoverX) &&
      y >= Math.min(mouseY, hoverY) &&
      y <= Math.max(mouseY, hoverY) &&
      x <= Math.max(mouseX, hoverX)
  }

  isActive (bookingId) {
    return this.props.activeBooking === bookingId
  }

  tick () {
    this.setState(this._calcPosition())
  }

  _calcPosition (): { nowPosition: number, offLimitsPosition: number } {
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
      case 'span':
        const span = event.target
        if (!span.classList.contains('resizer')) {
          this.setState({mouseDownStart: null})
          break
        }
        this.setState({mouseDownStart: this.spanToTablePos(span)})
        break
      case 'td':
        const td = event.target
        this.setState({mouseDownStart: this.tdToTablePos(td)})
        break
      default:
        this.setState({mouseDownStart: null})
    }
  }

  handleMouseUp (event) {
    const mouseDownStart = this.state.mouseDownStart
    if (!mouseDownStart) return
    let td
    switch (event.target.tagName.toLowerCase()) {
      case 'span':
        td = event.target.parentNode
        break
      case 'td':
        td = event.target
    }
    if (!td) {
      return
    }
    const {x, y} = this.tdToTablePos(td)
    const {x: fromX, y: fromY, resizeId, yCorrection} = mouseDownStart
    const booking = this.props.bookings[resizeId || '']
    this.setState({mouseDownStart: null})
    if (booking && (yCorrection || 0) < 0 && this.dateToY(moment(booking.from).tz(this.props.laundry.timezone), 0) < y) {
      return this.update(booking, {from: {x, y}})
    }
    if (booking && (yCorrection || 0) > 0 && this.dateToY(moment(booking.to).tz(this.props.laundry.timezone), 48) > y) {
      return this.update(booking, {to: {x, y: y + 1}})
    }
    this.book({x: fromX, y: this.lockedY(fromY)}, {y, x: this.lockedX(x)})
  }

  book (from, to) {
    const {max, min} = TimetableTable._fixPos(from, to)
    const maxExclusive = {x: max.x + 1, y: max.y + 1}
    return Promise.all(range(min.x, maxExclusive.x)
      .map(async x => {
        const machine = this.props.machines[this.props.laundry.machines[x]]
        if (machine.broken) return
        const r = await sdk.api.machine.createBooking(machine.id, {from: this.posToDate(min), to: this.posToDate(maxExclusive)})
        ReactGA.event({category: 'Booking', action: 'Create booking'})
        return r
      }))
  }

  async update (booking, {from, to}: { from?: *, to?: * }) {
    const machine = this.props.machines[booking.machine]
    if (machine.broken) return
    const r = sdk.api.booking.updateBooking(booking.id, {from: from && this.posToDate(from), to: to && this.posToDate(to)})
    ReactGA.event({category: 'Booking', action: 'Update booking'})
    return r
  }

  tdToTablePos (td) {
    return {x: td.cellIndex, y: td.parentNode.rowIndex + this.props.times[0]}
  }

  spanToTablePos (span) {
    const td = span.parentNode
    const {x, y} = this.tdToTablePos(td)
    const resizeId = span.dataset.id
    const booking = this.props.bookings[resizeId]
    const bookingFromY = booking && this.dateToY(moment(booking.from).tz(this.props.laundry.timezone), 0)
    const bookingToY = booking && this.dateToY(moment(booking.to).tz(this.props.laundry.timezone), 48)
    return {
      y,
      x,
      lock: true,
      bookingFromY,
      bookingToY,
      yCorrection: span.classList.contains('top') ? -1 : 1,
      resizeId
    }
  }

  dateToY (date, def) {
    return date.isSame(this.props.date, 'd')
      ? Math.floor((date.hours() * 60 + date.minutes()) / 30)
      : def
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

  static _fixPos (pos1, pos2) {
    return {
      min: {x: Math.min(pos1.x, pos2.x), y: Math.min(pos1.y, pos2.y)},
      max: {x: Math.max(pos1.x, pos2.x), y: Math.max(pos1.y, pos2.y)}
    }
  }

  reset () {
    this.hover({x: -1, y: -1})
  }

  handleMouseOut (evt: *) {
    this.reset()
  }

  hover ({x, y}) {
    this.props.onHoverRow(y)
    this.props.onHoverColumn(x)
  }

  lockedX (x) {
    return this.state.mouseDownStart && this.state.mouseDownStart.lock ? this.state.mouseDownStart.x : x
  }

  lockedY (y) {
    return y + ((this.state.mouseDownStart && this.state.mouseDownStart.yCorrection) || 0)
  }

  hoverTd (td) {
    const {x, y} = this.tdToTablePos(td)
    this.hover({x: this.lockedX(x), y})
  }

  handleMouseOver (event) {
    switch (event.target.tagName.toLowerCase()) {
      case 'td':
        this.hoverTd(event.target)
        break
      case 'span':
        this.hoverTd(event.target.parentNode)
        break
      default:
        this.reset()
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
    return <div
      className='overlay_container'
      ref={ref => {
        this.ref = ref
      }}>
      <div className='overlay'>
        <div className='off_limits' style={{height: this.state.offLimitsPosition + '%'}}/>
        {this.state.nowPosition > 0 && this.state.nowPosition < 100
          ? <div className='now' style={{top: this.state.nowPosition + '%'}} data-time={time}/> : ''}
      </div>
      <table
        ref={ref => {
          this.tableRef = ref
        }}
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

export default class TimetableTables extends React.Component<{
  onActiveChange: Function,
  currentUser: string,
  activeBooking: ?string,
  offsetDate?: string,
  onHoverColumn: Function,
  hoverColumn: number,
  dates: moment[],
  laundry: Laundry,
  machines: { [string]: Machine },
  bookings: { [string]: Booking }
  }, { hoverRow: number }> {
  state = {hoverRow: -1}

  componentWillReceiveProps ({dates, laundry: {id}}: { dates: moment[], laundry: Laundry }) {
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

  times () {
    if (!this.props.laundry.rules.timeLimit) return range(48)
    const {hour: fromHour, minute: fromMinute} = this.props.laundry.rules.timeLimit.from
    const {hour: toHour, minute: toMinute} = this.props.laundry.rules.timeLimit.to
    const from = Math.floor(fromHour * 2 + fromMinute / 30)
    const to = Math.floor(toHour * 2 + toMinute / 30)
    return range(from, to)
  }

  render () {
    const times = this.times()
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
          hoverColumn={this.props.hoverColumn - (this.props.laundry.machines.length * i)}
          onHoverRow={row => this.setState({hoverRow: row})}
          onHoverColumn={j => this.props.onHoverColumn(j < 0 ? -1 : (i * this.props.laundry.machines.length + j))}
          date={date}
          machines={this.props.machines}
          laundry={this.props.laundry}
          bookings={this.props.bookings}
          times={times}
          key={date.format('YYYY-MM-DD')}/>)}
        {timeList}
      </div>
    </section>
  }
}
