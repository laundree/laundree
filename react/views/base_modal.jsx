const React = require('react')

class BaseModal extends React.Component {
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

  renderContent () {
    return null
  }

  render () {
    if (!this.props.show) return null
    return <div className='confirmation_container'>
      <div className='confirmation_overlay' onClick={this.props.onClose}/>
      <div className='confirmation_box'>
        {this.renderContent() || this.props.children}
      </div>
    </div>
  }
}

BaseModal.propTypes = {
  show: React.PropTypes.bool,
  onClose: React.PropTypes.func,
  children: React.PropTypes.any
}

module.exports = BaseModal
