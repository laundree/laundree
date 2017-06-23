// @flow

import {connect} from 'react-redux'
import GAWrapper from '../views/GAWrapper'

const mapStateToProps = ({currentUser}, {location}) => {
  return {currentUser, location}
}

export default connect(mapStateToProps)(GAWrapper)
