// @flow

import {connect} from 'react-redux'
import Verification from '../views/Verification'

const mapStateToProps = ({config: {locale}}) => ({locale})

export default connect(mapStateToProps)(Verification)
