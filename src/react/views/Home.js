/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const {DocumentTitle} = require('./intl')
const sdk = require('../../client/sdk')
const {FormattedMessage} = require('react-intl')
const AdminPanel = require('../containers/AdminPanel')
const CreateLaundry = require('../containers/CreateLaundry')
const {Redirect} = require('react-router')

class DemoButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = {loading: false, email: '', password: ''}
    this.clickHandler = () => {
      this.setState({loading: true})
      sdk.laundry.createDemoLaundry().then(({email, password}) => this.setState({
        email,
        password
      }, () => this.ref.submit()))
    }
    this.refPuller = (ref) => {
      this.ref = ref
    }
  }

  render () {
    return <div>
      <span onClick={this.clickHandler} className={this.state.loading ? 'loading' : ''}>
        <svg className='step'>
          <use xlinkHref='#DemoMachine' />
        </svg>
      </span>
      <form hidden ref={this.refPuller} method='post' action='/auth/local'>
        <input type='hidden' name='username' value={this.state.email} />
        <input type='hidden' name='password' value={this.state.password} />
      </form>
    </div>
  }
}

const HomeNotLoggedIn = () => <DocumentTitle title='document-title.home'>
  <div id='Home'>
    <header>
      <div>
        <a href='/'>
          <svg id='Logo'>
            <use xlinkHref='#MediaLogo' />
          </svg>
        </a>
        <FormattedMessage id='home.teaser' tagName='h2' values={{nl: <br />}} />
        <div className='credit'>
          <FormattedMessage id='home.clip.credit' values={{
            link: <a href='http://www.beachfrontbroll.com' target='_blank'>
              <FormattedMessage id='home.clip.credit.link' />
            </a>
          }} />
        </div>
      </div>
      <div>
        <video loop='loop' autoPlay preload='meta' poster='/videos/v.png'>
          <source src='/videos/v.mp4' type='video/mp4' />
          <source src='/videos/v.mov' type='video/mov' />
          <source src='/videos/v.webm' type='video/webm' />
          <source src='/videos/v.ogv' type='video/ogg' />
        </video>
      </div>
    </header>
    <main>
      <div id='BackgroundArt' />
      <section id='QuickStart'>
        <h1>
          <FormattedMessage id='home.quickstart.signup' values={{nl: <br />}} />
        </h1>
        <ul>
          <li>
            <svg className='step'>
              <use xlinkHref='#Step1' />
            </svg>
            <div>
              <FormattedMessage tagName='h2' id='general.create' />
              <FormattedMessage id='home.quickstart.create' values={{nl: <br />}} />
            </div>
          </li>
          <li>
            <svg className='step'>
              <use xlinkHref='#Step2' />
            </svg>
            <div>
              <FormattedMessage tagName='h2' id='general.register' />
              <FormattedMessage id='home.quickstart.register' values={{nl: <br />}} />
            </div>
          </li>
          <li>
            <svg className='step'>
              <use xlinkHref='#Step3' />
            </svg>
            <div>
              <FormattedMessage tagName='h2' id='general.invite' />
              <FormattedMessage id='home.quickstart.invite' values={{nl: <br />}} />
            </div>
          </li>
        </ul>
      </section>
      <section id='StartDemo'>
        <FormattedMessage tagName='h1' id='home.start-demo' />
        <DemoButton />
      </section>
    </main>
  </div>
</DocumentTitle>

const Home = ({users, currentUser}) => {
  const user = users[currentUser]
  if (!user) return <HomeNotLoggedIn />
  if (user.role === 'admin') return <AdminPanel />
  if (!user.laundries.length) return <CreateLaundry />
  return <Redirect to={`/laundries/${user.laundries[0]}/timetable`} />
}

Home.propTypes = {
  users: React.PropTypes.object.isRequired,
  currentUser: React.PropTypes.string
}

module.exports = Home
