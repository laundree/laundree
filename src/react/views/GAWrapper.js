const ReactGA = require('react-ga')
const React = require('react')

class GAWrapper extends React.Component {
  log () {
    ReactGA.set({
      userId: this.props.currentUser,
      path: this.props.location.pathname
    })
    ReactGA.pageview(this.props.location.pathname)
  }

  componentWillReceiveProps () {
    this.log()
  }

  componentDidMount () {
    this.log()
  }

  render () {
    return this.props.children
  }
}

GAWrapper.propTypes = {
  currentUser: React.PropTypes.string,
  children: React.PropTypes.any,
  location: React.PropTypes.object
}

module.exports = GAWrapper
