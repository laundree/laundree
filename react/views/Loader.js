const React = require('react')

class Loader extends React.Component {
  constructor (props, initState = {}) {
    super(props)
    this.state = Object.assign({}, initState, {loaded: Boolean(this.props.loaded)})
  }

  componentDidMount () {
    if (this.state.loaded) return
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
  children: React.PropTypes.any,
  loader: React.PropTypes.func.isRequired,
  loaded: React.PropTypes.any
}

module.exports = Loader
