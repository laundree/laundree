const React = require('react')
const {DropDown, DropDownTitle, DropDownContent, DropDownCloser} = require('./dropdown.jsx')
const locales = require('../../locales')

class LocaleSelect extends React.Component {

  constructor (props) {
    super(props)
    this.state = {redirect: '/'}
  }

  componentDidMount () {
    this.setState({redirect: window.location.pathname})
  }

  render () {
    return <DropDown className='language'>
      <DropDownTitle>
        <svg>
          <use xlinkHref='#Globe'/>
        </svg>
      </DropDownTitle>
      <DropDownContent className='right'>
        <ul className='dropDownList'>
          {Object.keys(locales).map(l => <li key={l} className={this.props.locale === l ? 'active' : ''}>
            <DropDownCloser>
              <a
                href={`/lang/${l}?r=${encodeURIComponent(this.state.redirect)}`}
                className='link'>{locales[l].name}</a>
            </DropDownCloser>
          </li>)}
        </ul>
      </DropDownContent>
    </DropDown>
  }
}

LocaleSelect.propTypes = {
  locale: React.PropTypes.string.isRequired
}

module.exports = LocaleSelect
