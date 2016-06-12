const React = require('react')
const DocumentTitle = require('react-document-title')

class CreateLaundry extends React.Component {
  render () {
    return <DocumentTitle title='Create Laundry'>
      <main id='CreateLaundry'>
        <section>
          <h1>Couldn't find any laundry...</h1>
          <div>
            It doesn't seem like you have any laundry attached to your account.
            If you want to share your machines with your tenants, please create a new laundry.
          </div>
          <div className='create'>
            <button>Create a laundry</button>
          </div>
          <div>
            Are you a tenant who wants to use laundree for your laundry? Please tell your
            landlord to use Laundree or invite you if he already is.
          </div>
        </section>
      </main>
    </DocumentTitle>
  }
}

module.exports = CreateLaundry
