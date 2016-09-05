const React = require('react')
const DocumentTitle = require('react-document-title')

const Privacy = () => <DocumentTitle title='Privacy Policy and Terms and conditions' >
  <section id='Privacy'>
    <h1>Privacy Policy and Terms and Conditions</h1>
    <div className='disclaimer'>
      <b>Note</b> This is just a initial draft while we are in beta. This WILL change!
    </div>
    We reserve the right to do what ever we like with the data you provide us, including, but not limited to, deleting
    and modifying the data form our servers. Furthermore we reserve the right to update our policies with no warning.<br />
    <br />
    The service is as is with no guarantee of uptime or continuity of service. The source code is available at <a href='https://github.com/laundree/laundree' target='_blank'>github.com/laundree/laundree</a>
    and as a open source project we allow anyone to view and propose changes to the source code. We take absolutely no responsibility of any bugs, intended or not, introduced by this practice.<br />
    <br />
    While we realise that this policy might seam a bit excessive, we invite anyone with legal experience
    to help us formulate a proper policy. If you are able to help us, please contact us at <a href='mainto:budde@laundree.io'>budde@laundree.io</a>.
  </section>
</DocumentTitle>

module.exports = Privacy
