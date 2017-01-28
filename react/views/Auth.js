/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const LocaleSelector = require('./LocaleSelect')

const Auth = ({children, locale, location}) => <div>
  <nav id='AuthNav'>
    <LocaleSelector locale={locale} location={location}/>
  </nav>
  <main>
    <section id='Auth'>
      {children}
    </section>
  </main>
</div>

Auth.propTypes = {
  locale: React.PropTypes.string,
  location: React.PropTypes.object,
  children: React.PropTypes.any
}

module.exports = Auth
