/**
 * Created by budde on 28/05/16.
 */
var lodash = require('lodash')
var React = require('react')
function maxMin (value, max, min) {
  return Math.max(Math.min(value, max), min)
}

class TimetableTable extends React.Component {

  constructor (props) {
    super(props)
    this.state = this._calcPosition()
  }

  _row (key) {
    return <tr key={key}>{this.props.machines.map((m) => <td key={m.id} />)}</tr>
  }

  componentDidMount () {
    this.interval = setInterval(() => this.tick(), 1000)
  }

  componentWillUnmount () {
    clearInterval(this.interval)
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

  render () {
    var now = new Date()
    var hours = now.getHours()
    var minutes = now.getMinutes()
    var time = hours.toString() + ':' + (minutes < 10 ? '0' + minutes.toString() : minutes.toString())
    return <div className='overlay_container'>
      <div className='overlay'>
        <div className='off_limits' style={{height: this.state.offLimitsPosition + '%'}}></div>
        {this.state.nowPosition > 0 && this.state.nowPosition < 100
          ? <div className='now' style={{top: this.state.nowPosition + '%'}} data-time={time}></div> : ''}
      </div>
      <table>
        <tbody>
        {lodash.range(48).map((key) => this._row(key))}
        </tbody>
      </table>
    </div>
  }
}

TimetableTable.propTypes = {
  machines: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
  date: React.PropTypes.instanceOf(Date).isRequired
}

module.exports = TimetableTable
