/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const Footer = require('./footer.jsx')

const Auth = ({children}) => <div>
  <main>
    <section id='Auth'>
      {children}
    </section>
  </main>
  <Footer />
</div>

Auth.propTypes = {
  children: React.PropTypes.any
}

module.exports = Auth
