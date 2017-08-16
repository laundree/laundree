// @flow

import {connect} from 'react-redux'
import TermsAndConditions from '../views/TermsAndConditions'

const mapStateToProps = ({config: {locale}}) => ({locale})

export default connect(mapStateToProps)(TermsAndConditions)
