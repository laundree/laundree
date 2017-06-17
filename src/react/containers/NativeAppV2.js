// @flow

import {connect} from 'react-redux'
import NativeAppV2 from '../views/NativeAppV2'

const mapStateToProps = ({currentUser, users}) => {
  return {currentUser, users}
}

export default connect(mapStateToProps)(NativeAppV2)
