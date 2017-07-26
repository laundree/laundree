// @flow

import {connect} from 'react-redux'
import Forgot from '../views/Forgot'

const mapStateToProps = ({config: {locale}}) => ({locale})

export default connect(mapStateToProps)(Forgot)
