// @flow

import { connect } from 'react-redux'
import Verification from '../views/Verification'
import { localeFromLocation } from '../../locales'

const mapStateToProps = (_, {location}) => ({locale: localeFromLocation(location)})

export default connect(mapStateToProps)(Verification)
