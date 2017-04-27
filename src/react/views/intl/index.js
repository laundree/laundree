const React = require('react')
const DocumentTitle = require('react-document-title')
const {injectIntl} = require('react-intl')

function elementFactory (element, property, defaults = {}) {
  const f = props => {
    const newProp = {}
    newProp[property] = props.intl.formatMessage({id: props[property]})
    const newProps = Object.assign({}, defaults, props, newProp)
    delete newProps.intl
    return React.createElement(element, newProps)
  }
  f.propTypes = {
    intl: React.PropTypes.shape({
      formatMessage: React.PropTypes.func.isRequired
    })
  }
  f.propTypes[property] = React.PropTypes.string.isRequired
  return injectIntl(f)
}

module.exports = {
  DocumentTitle: elementFactory(DocumentTitle, 'title'),
  Input: elementFactory('input', 'placeholder'),
  Submit: elementFactory('input', 'value', {type: 'submit'}),
  TextArea: elementFactory('textarea', 'placeholder'),
  Label: elementFactory('label', 'data-validate-error'),
  Modal: require('./modal')
}
