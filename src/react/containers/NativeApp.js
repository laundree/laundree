// @flow
import {connect} from 'react-redux'
import NativeApp from '../views/NativeApp'

const mapStateToProps = ({currentUser, users}) => {
  return {currentUser, users}
}

export default connect(mapStateToProps)(NativeApp)
