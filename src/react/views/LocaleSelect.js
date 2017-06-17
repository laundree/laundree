const React = require('react')
const {DropDown, DropDownTitle, DropDownContent, DropDownCloser} = require('./dropdown')
const locales = require('../../locales')

const LocaleSelect = props => <DropDown className='language'>
  <DropDownTitle>
    <svg>
      <use xlinkHref='#Globe' />
    </svg>
  </DropDownTitle>
  <DropDownContent className='right'>
    <ul className='dropDownList'>
      {locales.supported.map(l => <li key={l} className={props.locale === l ? 'active' : ''}>
        <DropDownCloser>
          <a
            href={`/lang/${l}?r=${encodeURIComponent(props.location.pathname)}`}
            className='link'>{locales[l].name}</a>
        </DropDownCloser>
      </li>)}
    </ul>
  </DropDownContent>
</DropDown>

LocaleSelect.propTypes = {
  location: React.PropTypes.object,
  locale: React.PropTypes.string.isRequired
}

module.exports = LocaleSelect
