// @flow

import { connect } from 'react-redux'
import Login from '../views/Login'
import queryString from 'querystring'
import { localeFromLocation } from '../../locales'

const mapStateToProps = ({flash}, {location}) => ({
  locale: localeFromLocation(location),
  flash,
  to: location && location.search && queryString.parse(location.search.substr(1)).to
})

export default connect(mapStateToProps)(Login)
