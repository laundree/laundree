/**
 * Created by budde on 28/06/16.
 */

const React = require('react')

class Modal extends React.Component {

  constructor (props) {
    super(props)
    this.escListener = (event) => {
      if (!this.props.onClose) return
      if (event.keyCode !== 27) return
      this.props.onClose()
    }
  }

  componentWillUnmount () {
    document.removeEventListener('keyup', this.escListener)
  }

  componentDidMount () {
    document.addEventListener('keyup', this.escListener)
  }

  render () {
    const actions = this.props.actions || []
    if (!this.props.show) return null
    return <div className="confirmation_container">
      <div className="confirmation_overlay" onClick={this.props.onClose}/>
      <div className="confirmation_box">
        <div className="message">
          {this.props.message}
        </div>
        <ul>
          {actions.map((action, i) => <li key={i}>
            <button className={action.className} onClick={action.action}>{action.label}</button>
          </li>)}
        </ul>
      </div>
    </div>
  }
}

Modal.propTypes = {
  show: React.PropTypes.bool,
  message: React.PropTypes.string,
  onClose: React.PropTypes.func,
  actions: React.PropTypes.arrayOf(React.PropTypes.shape({
    label: React.PropTypes.string.isRequired,
    className: React.PropTypes.string,
    action: React.PropTypes.func
  }))
}

module.exports = Modal
