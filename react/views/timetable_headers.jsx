/**
 * Created by budde on 28/05/16.
 */

const React = require('react')
const reactIntl = require('react-intl')
const string = require('../../utils/string')
const {Link} = require('react-router')

const TimetableHeader = (props) => {
  return <div className='header_container'>
    <div className='date'>
      <reactIntl.FormattedDate weekday='short' month='numeric' day='numeric' value={props.date}/>
    </div>
    <table>
      <tbody>
      <tr className='machines'>
        {props.laundry.machines
          .map((id) => props.machines[id])
          .map((machine, i) => <td
            key={machine.id}
            className={machine.type + (props.hoverColumn === i ? ' hoverColumn' : '')}>
            <svg>
              <use xlinkHref={machine.type === 'dry' ? '#Waves' : '#Drop'}></use>
            </svg>
          </td>)}
      </tr>
      <tr className='labels'>
        {props.laundry.machines
          .map((id) => props.machines[id])
          .map((machine, i) => <td key={machine.id} className={props.hoverColumn === i ? ' hoverColumn' : ''}>
            <div><span>{string.shortName(machine.name)}</span></div>
          </td>)}
      </tr>
      </tbody>
    </table>
  </div>
}
TimetableHeader.propTypes = {
  hoverColumn: React.PropTypes.number,
  laundry: React.PropTypes.object.isRequired,
  date: React.PropTypes.instanceOf(Date).isRequired,
  machines: React.PropTypes.object.isRequired
}

class TimeTableHeaderNav extends React.Component {

  get firstDate () {
    return this.props.dates[0]
  }

  get lastDate () {
    return this.props.dates[this.props.dates.length - 1]
  }

  get yesterday () {
    const d = new Date(this.props.dates[0].getTime())
    d.setDate(d.getDate() - 1)
    return d
  }

  get tomorrow () {
    const d = new Date(this.props.dates[0].getTime())
    d.setDate(d.getDate() + 1)
    return d
  }

  render () {
    const calendar = <Link to={`/laundries/${this.props.laundry.id}/timetable`}>
      <svg className='today'>
        <use xlinkHref='#Calendar'/>
      </svg>
    </Link>
    if (this.props.dates.length === 0) return null
    const navLeft = <Link
      className='left arrow'
      to={`/laundries/${this.props.laundry.id}/timetable?offsetDate=${this.yesterday.getTime()}`}/>
    const navRight = <Link
      className='right arrow'
      to={`/laundries/${this.props.laundry.id}/timetable?offsetDate=${this.tomorrow.getTime()}`}/>
    if (this.props.dates.length === 1) {
      return <div className='nav'>
        {navLeft}
        {calendar}
        <reactIntl.FormattedDate
          weekday='short' month='numeric' day='numeric'
          value={this.firstDate}/>
        {navRight}
      </div>
    }

    return <div className='nav'>
      {navLeft}
      {calendar}
      from{' '}
      <reactIntl.FormattedDate weekday='short' month='numeric' day='numeric' value={this.firstDate}/>
      {' '}
      to{' '}
      <reactIntl.FormattedDate weekday='short' month='numeric' day='numeric' value={this.lastDate}/>
      {navRight}
    </div>
  }
}

TimeTableHeaderNav.propTypes = {
  laundry: React.PropTypes.object,
  dates: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Date)).isRequired
}

const TimetableHeaders = (props) => {
  return <header
    className={props.dates.length && props.dates[0].setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0) ? 'today' : undefined}>
    <div className='date_nav'>
      <h1>
        Timetable
      </h1>
      <TimeTableHeaderNav
        laundry={props.laundry}
        dates={props.dates}/>
    </div>
    <div id='TimeTableHeader'>
      {props.dates.map((date, i) => <TimetableHeader
        hoverColumn={props.hoverColumn - (i * props.laundry.machines.length)}
        laundry={props.laundry} machines={props.machines} date={date}
        key={date}/>)}
    </div>
  </header>
}

TimetableHeaders.propTypes = {
  hoverColumn: React.PropTypes.number,
  laundry: React.PropTypes.object.isRequired,
  dates: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Date)).isRequired,
  machines: React.PropTypes.object.isRequired
}

module.exports = TimetableHeaders
