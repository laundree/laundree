const React = require('react')
const DocumentTitle = require('react-document-title')

const About = () => <DocumentTitle title='About us' >
  <main>
    <section id='About'>
      <h1>About us</h1>
      <div id='Family'>
        <h2>Family</h2>
        We're Christian and Malene, a mid-twenties computer geek couple, who have
        found a common passion in saving the world one load of laundry at a time.
        <br/>
        Christian is a fulltime software developer at a small startup company. He is a
        passionate web developer and is always staying up-to-date on what is new and hot
        on the WWW.
        <br/>
        Malene is a fulltime PhD-student in computer science. She loves exploring the
        posibilities of data and wants to nudge the world into a more environmentally
        friendly place with data.
        <br/>
        Our common backgrounds gave us the opportunity to start Laundree together, which
        we now spend most of our spare time on. We love to work together with other people,
        so our project is OpenSource on Github and we highly recommend anyone to help contribute!
        <br/>
        Of course, we value privacy and anonymity, keeping our users' data secret and safe.
      </div>
      <div id='Mission'>
        <h2>Mission</h2>
        Our mission is two-fold; we want the daily lives of our landlords and tenants to
        become easier and much more enjoyable by building a platform supporting laundry facilities
        and also the communication between landlords and tenants.
        <br/>
        We also want to improve the environment by encouring more people to share their laundry
        facilities while nudging peope to wash at times during the day that are more environmentally
        friendly by analysing anonymised data collected from our users.
      </div>
    </section>
  </main>
</DocumentTitle>

module.exports = About
