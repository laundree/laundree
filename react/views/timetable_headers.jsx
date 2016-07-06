/**
 * Created by budde on 28/05/16.
 */

const React = require('react')
const reactIntl = require('react-intl')
const string = require('../../utils/string')

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
          .map((machine) => <td key={machine.id} className={machine.type}>
            <svg>
              <use xlinkHref={machine.type === 'dry' ? '#Waves' : '#Drop'}></use>
            </svg>
          </td>)}
      </tr>
      <tr className='labels'>
        {props.laundry.machines
          .map((id) => props.machines[id])
          .map((machine) => <td key={machine.id}>
            <div><span>{string.shortName(machine.name)}</span></div>
          </td>)}
      </tr>
      </tbody>
    </table>
  </div>
}
TimetableHeader.propTypes = {
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

  render () {
    const calendar = <svg className='today' onClick={this.props.onToday}>
      <use xlinkHref='#Calendar'/>
    </svg>
    const navLeft = <div className='left arrow' onClick={this.props.onYesterday}/>
    const navRight = <div className='right arrow' onClick={this.props.onTomorrow}/>
    if (this.props.dates.length === 0) return null
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
  dates: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Date)).isRequired,
  onToday: React.PropTypes.func,
  onTomorrow: React.PropTypes.func,
  onYesterday: React.PropTypes.func
}

const TimetableHeaders = (props) => {
  return <header
    className={props.dates.length && props.dates[0].setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0) ? 'today' : undefined}>
    <div className='date_nav'>
      <h1>
        Timetable
      </h1>
      <TimeTableHeaderNav
        onToday={props.onToday}
        onTomorrow={props.onTomorrow}
        onYesterday={props.onYesterday}
        dates={props.dates}/>
    </div>
    <div id='TimeTableHeader'>
      {props.dates.map((date) => <TimetableHeader
        laundry={props.laundry} machines={props.machines} date={date}
        key={date}/>)}
    </div>
  </header>
}

TimetableHeaders.propTypes = {
  onToday: React.PropTypes.func,
  onTomorrow: React.PropTypes.func,
  onYesterday: React.PropTypes.func,
  laundry: React.PropTypes.object.isRequired,
  dates: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Date)).isRequired,
  machines: React.PropTypes.object.isRequired
}

module.exports = TimetableHeaders
