/**
 * Created by budde on 28/05/16.
 */
var reactIntl = require('react-intl')
var React = require('react')
const TimetableHeader = (props) => <div className='header_container'>
  <div className='date'>
    <reactIntl.FormattedDate weekday='long' month='numeric' day='numeric' value={props.date} />
  </div>
  <table>
    <tbody>
      <tr className='machines'>
        {props.machines.map((machine) => <td key={machine.id} className={machine.type}>
          <svg>
            <use xlinkHref={machine.type === 'dry' ? '#Waves' : '#Drop'}></use>
          </svg>
        </td>)}
      </tr>
      <tr className='labels'>
        {props.machines.map((machine) => <td key={machine.id}>{machine.label}</td>)}
      </tr>
    </tbody>
  </table>
</div>

TimetableHeader.propTypes = {
  date: React.PropTypes.instanceOf(Date).isRequired,
  machines: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
}

module.exports = TimetableHeader

