// @flow
import React from 'react'
import {Route} from 'react-router'

const Status = ({code, children}: {code: number, children?: *}) => (
  // $FlowFixMe this is present...
  <Route render={({staticContext}) => {
    if (staticContext) {
      staticContext.statusCode = code
    }
    return children || null
  }} />
)

export default class NotFound extends React.Component<*> {
  componentDidMount () {
    window.location.reload()
  }

  render () {
    return <Status code={404} />
  }
}
