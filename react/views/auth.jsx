/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const LocaleSelect = require('./locale_select.jsx')

const Auth = ({children, locale}) => <div>
  <nav id='AuthNav'>
    <LocaleSelect locale={locale}/>
  </nav>
  <main>
    <section id='Auth'>
      {children}
    </section>
  </main>
</div>

Auth.propTypes = {
  locale: React.PropTypes.string,
  children: React.PropTypes.any
}

module.exports = Auth
