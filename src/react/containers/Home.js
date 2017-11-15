// @flow
import {connect} from 'react-redux'
import Home from '../views/Home'
import { localeFromLocation } from '../../locales'

const mapStateToProps = ({users, currentUser}, {location}) => {
  return {users, currentUser, locale: localeFromLocation(location)}
}

export default connect(mapStateToProps)(Home)
