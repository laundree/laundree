/**
 * Created by budde on 28/05/16.
 */

const React = require('react')
const reactIntl = require('react-intl')
const string = require('../../utils/string')
const {Link} = require('react-router')
const moment = require('moment-timezone')

const TimetableHeader = (props) => {
  const machines = props.laundry.machines
    .map((id) => props.machines[id])
    .filter((m) => m)
  return <div className='header_container'>
    <div className='date'>
      <reactIntl.FormattedDate
        weekday='short' month='numeric' day='numeric'
        value={new Date(props.date.format('YYYY-MM-DD'))}/>
    </div>
    <table className={machines.length > 5 ? 'compressed' : ''}>
      <tbody>
      <tr className='machines'>
        {machines
          .map((machine, i) => <td
            key={machine.id}
            className={machine.type + (props.hoverColumn === i ? ' hoverColumn' : '')}>
            <svg>
              <use xlinkHref={machine.type === 'dry' ? '#Waves' : '#Drop'}/>
            </svg>
          </td>)}
      </tr>
      <tr className='labels'>
        {machines
          .map((machine, i) => <td key={machine.id} className={props.hoverColumn === i ? ' hoverColumn' : ''}>
            <div><span className='longName'>{machine.name}</span><span
              className='shortName'>{string.shortName(machine.name)}</span></div>
          </td>)}
      </tr>
      </tbody>
    </table>
  </div>
}
TimetableHeader.propTypes = {
  hoverColumn: React.PropTypes.number,
  laundry: React.PropTypes.object.isRequired,
  date: React.PropTypes.object.isRequired,
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
    return this.firstDate.clone().subtract(1, 'd')
  }

  get tomorrow () {
    return this.firstDate.clone().add(1, 'd')
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
      to={`/laundries/${this.props.laundry.id}/timetable?offsetDate=${this.yesterday.format('YYYY-MM-DD')}`}/>
    const navRight = <Link
      className='right arrow'
      to={`/laundries/${this.props.laundry.id}/timetable?offsetDate=${this.tomorrow.format('YYYY-MM-DD')}`}/>
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
      <reactIntl.FormattedDate
        weekday='short' month='numeric' day='numeric'
        value={new Date(this.firstDate.format('YYYY-MM-DD'))}/>
      {' '}
      to{' '}
      <reactIntl.FormattedDate
        weekday='short' month='numeric' day='numeric'
        value={new Date(this.lastDate.format('YYYY-MM-DD'))}/>
      {navRight}
    </div>
  }
}

TimeTableHeaderNav.propTypes = {
  laundry: React.PropTypes.object,
  dates: React.PropTypes.array.isRequired
}

const TimetableHeaders = (props) => {
  const now = moment.tz(props.laundry.timezone)
  return <header
    className={props.dates.length && props.dates[0].isSameOrBefore(now, 'd') ? 'today' : undefined}>
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
  dates: React.PropTypes.array.isRequired,
  machines: React.PropTypes.object.isRequired
}

module.exports = TimetableHeaders
