const React = require('react')

class Loader extends React.Component {

  constructor (props, initState = {}) {
    super(props)
    this.state = Object.assign({}, initState, {loaded: false})
  }

  componentDidMount () {
    Promise
      .resolve(this.props.loader())
      .then(() => this.setState({loaded: true}))
  }

  render () {
    return <div className={(this.state.loaded ? '' : 'loading blur') + ' loader'}>
      {this.state.loaded ? this.props.children : null}
    </div>
  }
}

Loader.propTypes = {
  children: React.PropTypes.any.isRequired,
  loader: React.PropTypes.func.isRequired
}

module.exports = Loader
