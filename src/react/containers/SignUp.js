// @flow

import { connect } from 'react-redux'
import SignUp from '../views/SignUp'
import queryString from 'querystring'
import { localeFromLocation } from '../../locales'

const mapStateToProps = (_, {location}) => ({
  locale: localeFromLocation(location),
  to: location && location.search && queryString.parse(location.search.substr(1)).to
})

export default connect(mapStateToProps)(SignUp)
