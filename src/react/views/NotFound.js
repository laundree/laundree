/**
 * Created by budde on 21/03/2017.
 */
const React = require('react')
const {Route} = require('react-router')

const Status = ({code, children}) => (
  <Route render={({staticContext}) => {
    if (staticContext) {
      staticContext.statusCode = code
    }
    return children || null
  }} />
)

Status.propTypes = {
  code: React.PropTypes.number.isRequired,
  children: React.PropTypes.any
}

class NotFound extends React.Component {
  componentDidMount () {
    window.location.reload()
  }

  render () {
    return <Status code={404} />
  }
}

module.exports = NotFound
