/**
 * Created by budde on 28/06/16.
 */

const React = require('react')
const {Modal} = require('../modal')
const {injectIntl} = require('react-intl')

const ModalIntl = props => {
  const newProps = {
    message: props.intl.formatMessage({id: props.message}),
    actions: props.actions.map(p => Object.assign({}, p, {label: props.intl.formatMessage({id: p.label})}))
  }
  return React.createElement(Modal, Object.assign({}, props, newProps))
}

ModalIntl.propTypes = {
  intl: React.PropTypes.shape({
    formatMessage: React.PropTypes.func.isRequired
  }),
  message: React.PropTypes.string,
  actions: React.PropTypes.arrayOf(React.PropTypes.shape({
    label: React.PropTypes.string.isRequired
  }))
}

module.exports = injectIntl(ModalIntl)
