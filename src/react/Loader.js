// @flow
import React from 'react'

export default class Loader extends React.Component<{
  children?: *,
  loader: Function,
  loaded?: boolean
  }, { loaded: boolean }> {
  state: { loaded: boolean } = {loaded: Boolean(this.props.loaded)}

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
