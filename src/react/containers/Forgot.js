// @flow

import {connect} from 'react-redux'
import Forgot from '../views/Forgot'
import { localeFromLocation } from '../../locales'

const mapStateToProps = (_, {location}) => ({locale: localeFromLocation(location)})

export default connect(mapStateToProps)(Forgot)
