const React = require('react')

class ActionProvider extends React.Component {
  getChildContext () {
    return {actions: this.props.actions || {}}
  }

  render () {
    return React.Children.only(this.props.children)
  }
}

ActionProvider.childContextTypes = {
  actions: React.PropTypes.objectOf(React.PropTypes.func).isRequired
}

ActionProvider.propTypes = {
  actions: React.PropTypes.objectOf(React.PropTypes.func),
  children: React.PropTypes.any
}

module.exports = ActionProvider
