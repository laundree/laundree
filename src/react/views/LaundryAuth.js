// @flow
import React from 'react'
import type { Match } from 'react-router'

type LaundryAuthProps = {
  match: Match
}

export default class LaundryAuth extends React.Component<LaundryAuthProps> {
  render () {
    const {laundryId, key} = this.props.match.params
    if (!laundryId || !key) {
      return null
    }
    return <div>
      LOL
    </div>
  }
}
