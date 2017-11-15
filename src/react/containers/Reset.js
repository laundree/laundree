// @flow

import {connect} from 'react-redux'
import Reset from '../views/Reset'
import { localeFromLocation } from '../../locales'

const mapStateToProps = (_, {location}) => ({locale: localeFromLocation(location), location})

export default connect(mapStateToProps)(Reset)
