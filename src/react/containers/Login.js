// @flow

import {connect} from 'react-redux'
import Login from '../views/Login'
import queryString from 'querystring'

const mapStateToProps = ({flash}, {location}) => ({flash, to: location && location.search && queryString.parse(location.search.substr(1)).to})

export default connect(mapStateToProps)(Login)
