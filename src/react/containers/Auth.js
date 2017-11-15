// @flow
import {connect} from 'react-redux'
import Auth from '../views/Auth'
import { localeFromLocation } from '../../locales'

const mapStateToProps = (_, {location, match}) => {
  return {locale: localeFromLocation(location), location, match}
}

export default connect(mapStateToProps)(Auth)
