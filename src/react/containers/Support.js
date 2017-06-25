// @flow

import {connect} from 'react-redux'
import Support from '../views/Support'

const mapStateToProps = ({currentUser, users}) => {
  return {currentUser, users}
}

export default connect(mapStateToProps)(Support)
