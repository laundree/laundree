// @flow
import {connect} from 'react-redux'
import Auth from '../views/Auth'

const mapStateToProps = ({config: {locale}}, {location}) => {
  return {locale, location}
}

export default connect(mapStateToProps)(Auth)
