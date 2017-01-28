const React = require('react')

const DropDownContent = (props) => <div
  className={'dropDownContent ' + (props.className ? props.className : '')}>{props.children}</div>

DropDownContent.propTypes = {
  className: React.PropTypes.string,
  children: React.PropTypes.any
}

module.exports = DropDownContent
