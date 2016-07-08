/**
 * Created by budde on 28/05/16.
 */

const React = require('react')
const lodash = require('lodash')

function maxMin (value, max, min) {
  return Math.max(Math.min(value, max), min)
}

class TimetableTable extends React.Component {

  constructor (props) {
    super(props)
    this.state = Object.assign({bookings: {}}, this._calcPosition())
  }

  _row (key, now) {
    var tooLate = false
    if (now) {
      now = new Date(now.getTime() + 10 * 60 * 1000)
      tooLate = now ? now.getHours() + (now.getMinutes() / 60) >= key / 2 : false
    }
    return <tr
      key={key}
      className={(tooLate ? 'too_late' : '') + (this.props.hoverRow === key ? ' hover' : '')}>
      {this.props.laundry.machines
        .map((id) => this.props.machines[id])
        .map((m, i) => <td key={m.id}>{this.isBooked(m.id, key) ? <div className='booking'/> : null}</td>)}
    </tr>
  }

  componentDidMount () {
    this._interval = setInterval(() => this.tick(), 60 * 1000)
  }

  componentWillUnmount () {
    clearInterval(this._interval)
  }

  componentWillReceiveProps ({bookings}) {
    const day = this.props.date.getDate()
    this.setState({
      bookings: Object.keys(bookings)
        .map((key) => bookings[key])
        .map(({from, to, machine}) => ({from: new Date(from), to: new Date(to), machine}))
        .filter(({from, to}) => to.getDate() >= day && from.getDate() <= day)
        .reduce((obj, {machine, from, to}) => {
          const fromY = TimetableTable.dateToY(from)
          const toY = TimetableTable.dateToY(to)
          lodash.range(fromY, toY).forEach((y) => {
            obj[`${machine}:${y}`] = true
          })
          return obj
        }, {})
    })
  }

  isBooked (x, y) {
    return this.state.bookings[`${x}:${y}`]
  }

  tick () {
    this.setState(this._calcPosition())
  }

  _calcPosition () {
    // TODO Check daylight saving time
    const now = new Date()
    const diff = now.getTime() - this.props.date.getTime()
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
    return Math.floor((date.getHours() * 60 + date.getMinutes()) / 30)
  }

  posToDate ({y}) {
    const d = new Date(this.props.date.getTime())
    const mins = y * 30
    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
    return d
  }

  book (from, to) {
    const {max, min} = TimetableTable._fixPos(from, to)
    const maxExclusive = {x: max.x + 1, y: max.y + 1}
    return Promise.all(lodash
      .range(min.x, maxExclusive.x)
      .map((x) => this.context.actions.createBooking(this.props.laundry.machines[x], this.posToDate(min), this.posToDate(maxExclusive))))
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
  }

  hoverTd (td) {
    this.hover(td.cellIndex, td.parentNode.rowIndex)
  }

  handleMouseOver (event) {
    switch (event.target.tagName.toLowerCase()) {
      case 'div':
        if (event.target.parentNode.tagName.toLowerCase() !== 'td') break
        this.hoverTd(event.target.parentNode)
        break
      case 'td':
        this.hoverTd(event.target)
        break
      default:
        this.props.onHoverRow(-1)
    }
  }

  render () {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const time = hours.toString() + ':' + (minutes < 10 ? '0' + minutes.toString() : minutes.toString())
    const today = new Date(now.getTime()).setHours(0, 0, 0, 0) === this.props.date.getTime()
    const tableMouseDownHandler = (event) => this.handleMouseDown(event)
    const tableMouseUpHandler = (event) => this.handleMouseUp(event)
    const tableMouseOverHandler = (event) => this.handleMouseOver(event)
    const tableMouseOutHandler = (event) => this.handleMouseOut(event)

    return <div className='overlay_container'>
      <div className='overlay'>
        <div className='off_limits' style={{height: this.state.offLimitsPosition + '%'}}></div>
        {this.state.nowPosition > 0 && this.state.nowPosition < 100
          ? <div className='now' style={{top: this.state.nowPosition + '%'}} data-time={time}></div> : ''}
      </div>
      <table
        onMouseOver={tableMouseOverHandler}
        onMouseOut={tableMouseOutHandler}
        onMouseDown={tableMouseDownHandler}
        onMouseUp={tableMouseUpHandler}>
        <tbody>
        {lodash.range(48).map((key) => this._row(key, today ? now : undefined))}
        </tbody>
      </table>
    </div>
  }
}

TimetableTable.propTypes = {
  machines: React.PropTypes.object.isRequired,
  laundry: React.PropTypes.object.isRequired,
  bookings: React.PropTypes.object.isRequired,
  date: React.PropTypes.instanceOf(Date).isRequired,
  onHoverRow: React.PropTypes.func.isRequired,
  hoverRow: React.PropTypes.number.isRequired
}

TimetableTable.contextTypes = {
  actions: React.PropTypes.shape({
    createBooking: React.PropTypes.func
  })
}

class TimetableTables extends React.Component {

  constructor (props) {
    super(props)
    this.state = {hoverRow: 1}
    this.hoverRowHandler = (row) => this.setState({hoverRow: row})
  }

  componentWillReceiveProps ({dates, laundry: {id}}) {
    const oldDates = this.props.dates
    if (dates.length === oldDates.length && oldDates.map((d) => d.getTime()).every((t, i) => t === dates[i].getTime())) return
    const firstDate = dates[0]
    const lastDate = dates[dates.length - 1]
    const lastDateExclusive = new Date(lastDate.getTime())
    lastDateExclusive.setDate(lastDate.getDate() + 1)
    this.context.actions.listBookings(id, firstDate, lastDateExclusive)
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
        {this.props.dates.map((date) => <TimetableTable
          hoverRow={this.state.hoverRow}
          onHoverRow={this.hoverRowHandler}
          date={date} machines={this.props.machines} laundry={this.props.laundry}
          bookings={this.props.bookings}
          key={date}/>)}
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

TimetableTables.contextTypes = {
  actions: React.PropTypes.shape({
    listBookings: React.PropTypes.func
  })
}

TimetableTables.propTypes = {
  dates: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Date)).isRequired,
  laundry: React.PropTypes.object.isRequired,
  machines: React.PropTypes.object.isRequired,
  bookings: React.PropTypes.object.isRequired
}

module.exports = TimetableTables
