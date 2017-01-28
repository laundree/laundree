const React = require('react')

const DropDownTitle = (props) => <div className='dropDownTitle' onClick={props.onClick}>{props.children}</div>

DropDownTitle.propTypes = {
  onClick: React.PropTypes.func,
  children: React.PropTypes.any
}

module.exports = DropDownTitle
