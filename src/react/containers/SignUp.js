// @flow

import {connect} from 'react-redux'
import SignUp from '../views/SignUp'
import queryString from 'querystring'

const mapStateToProps = ({location}) => ({to: location && location.search && queryString.parse(location.search.substr(1)).to})

export default connect(mapStateToProps)(SignUp)
