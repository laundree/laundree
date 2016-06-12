const React = require('react')

const Footer = () => <footer>
  <ul>
    <li>
      <svg xmlns='http://www.w3.org/2000/svg'>
        <use xlinkHref='#Brick'/>
      </svg>
      Created by
      Christian Budde Christensen and
      Malene Sjørslev Søholm
      in
      <a href='https://en.wikipedia.org/wiki/Aarhus' target='_blank'>Aarhus, Denmark</a>
    </li>
    <li>
      <svg xmlns='http://www.w3.org/2000/svg'>
        <use xlinkHref='#EMail13'/>
      </svg>
      Want to know more? Please contact and we'll try our best
      to reply in a timely manner. You can find our contact
      details at the
      <a href='/contact'>Contact page</a>
    </li>
    <li>
      <svg xmlns='http://www.w3.org/2000/svg'>
        <use xlinkHref='#GitHub'/>
      </svg>
      Laundree is 100% open-source and any contribution is highly appreciated
      File an issue, create a pull-request, or fork us on
      <a href='https://github.com/laundree/laundree' target='_blank'>GitHub</a>
    </li>
    <li>
      <svg xmlns='http://www.w3.org/2000/svg'>
        <use xlinkHref='#PayPal'/>
      </svg>
      Do you want to help us keep the servers running at full throttle?
      Then feel free to donate via
      <a href='#' target='_blank'>PayPal</a>
    </li>

  </ul>
</footer>

module.exports = Footer
