/**
 * Created by budde on 28/06/16.
 */

const React = require('react')
const BaseModal = require('./base_modal.jsx')

class Modal extends BaseModal {
  renderContent () {
    const actions = this.props.actions || []
    return <div>
      <div className='message'>
        {this.props.message}
      </div>
      <ul className='actionList'>
        {actions.map((action, i) => <li key={i}>
          <button className={action.className} onClick={action.action}>{action.label}</button>
        </li>)}
      </ul>
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
