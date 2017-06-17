// @flow

import {connect} from 'react-redux'
import CreateLaundry from '../views/CreateLaundry'

const mapStateToProps = ({users, currentUser, config: {googleApiKey, locale}}) => {
  return {user: users[currentUser], googleApiKey, locale}
}

export default connect(mapStateToProps)(CreateLaundry)
