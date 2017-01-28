const React = require('react')

class DropDownCloser extends React.Component {
  constructor (props) {
    super(props)
    this.generateOnClick = (fn) => (evt) => {
      if (fn) fn(evt)
      this.context.closeDropDown()
    }
  }

  get child () {
    return React.Children.only(this.props.children)
  }

  render () {
    const child = this.child
    return React.cloneElement(this.child, {onClick: this.generateOnClick(child.props.onClick)})
  }
}

DropDownCloser.contextTypes = {
  closeDropDown: React.PropTypes.func.isRequired
}

DropDownCloser.propTypes = {
  children: React.PropTypes.any
}

module.exports = DropDownCloser
