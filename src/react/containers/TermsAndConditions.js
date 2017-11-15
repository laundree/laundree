// @flow

import {connect} from 'react-redux'
import TermsAndConditions from '../views/TermsAndConditions'
import { localeFromLocation } from '../../locales'

const mapStateToProps = (_, {location}) => ({locale: localeFromLocation(location)})

export default connect(mapStateToProps)(TermsAndConditions)
