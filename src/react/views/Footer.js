const React = require('react')
const {FormattedMessage} = require('react-intl')
const {Link} = require('react-router-dom')

const Footer = () => <footer>
  <ul>
    <li>
      <svg xmlns='http://www.w3.org/2000/svg'>
        <use xlinkHref='#Brick'/>
      </svg>
      <FormattedMessage
        id='footer.created'
        values={{
          link: <a href='https://en.wikipedia.org/wiki/Aarhus' target='_blank'>
            <FormattedMessage id={'footer.created.link'}/>
          </a>
        }}/>
    </li>
    <li>
      <svg xmlns='http://www.w3.org/2000/svg'>
        <use xlinkHref='#EMail13'/>
      </svg>
      <FormattedMessage
        id='footer.contact'
        values={{
          link: <Link to='/contact'>
            <FormattedMessage id={'footer.contact.link'}/>
          </Link>
        }}/>
    </li>
    <li>
      <svg xmlns='http://www.w3.org/2000/svg'>
        <use xlinkHref='#GitHub'/>
      </svg>
      <FormattedMessage
        id='footer.github'
        values={{
          link: <a href='https://github.com/laundree/laundree' target='_blank'>
            <FormattedMessage id={'footer.github.link'}/>
          </a>
        }}/>
    </li>
    <li>
      <svg xmlns='http://www.w3.org/2000/svg'>
        <use xlinkHref='#PayPal'/>
      </svg>
      <FormattedMessage
        id='footer.donate'
        values={{
          link: <a href='#' target='_blank'>
            <FormattedMessage id={'footer.donate.link'}/>
          </a>
        }}/>
    </li>
  </ul>
</footer>

module.exports = Footer
