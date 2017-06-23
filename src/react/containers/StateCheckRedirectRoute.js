// @flow

import {connect} from 'react-redux'
import StateCheckRedirectRoute from '../views/StateCheckRedirectRoute'

const mapStateToProps = (state, props) => {
  return Object.assign({state}, props)
}

export default connect(mapStateToProps)(StateCheckRedirectRoute)
