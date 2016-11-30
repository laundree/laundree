const React = require('react')
const DocumentTitle = require('react-document-title')
const {injectIntl} = require('react-intl')

const DocumentTitleIntl = ({id, intl: {formatMessage}, children}) => <DocumentTitle
  title={formatMessage({id})}>{children}</DocumentTitle>

DocumentTitleIntl.propTypes = {
  children: React.PropTypes.any,
  id: React.PropTypes.string.isRequired,
  intl: React.PropTypes.shape({
    formatMessage: React.PropTypes.func.isRequired
  })
}
module.exports = injectIntl(DocumentTitleIntl)
