/**
 * Created by budde on 28/05/16.
 */

var React = require('react')
var reactIntl = require('react-intl')

const TimetableHeader = (props) => {
  return <div className='header_container'>
    <div className='date'>
      <reactIntl.FormattedDate weekday='long' month='numeric' day='numeric' value={props.date}/>
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
            <div><span>{machine.name}</span></div>
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

const TimetableHeaders = (props) => {
  return <header
    className={props.dates.length && props.dates[0].setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0) ? 'today' : undefined}>
    <h1>
      Timetable
    </h1>
    <div id='TimeTableHeader'>
      {props.dates.map((date) => <TimetableHeader
        laundry={props.laundry} machines={props.machines} date={date}
        key={date}/>)}
      <div className='nav'>
        <div className='step_back' />
        <div className='step_forward' />
      </div>

    </div>
  </header>
}

TimetableHeaders.propTypes = {
  laundry: React.PropTypes.object.isRequired,
  dates: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Date)).isRequired,
  machines: React.PropTypes.object.isRequired
}

module.exports = TimetableHeaders
