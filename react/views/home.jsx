/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')
const {LaundryClientSdk} = require('../../client/sdk')

class DemoButton extends React.Component {

  constructor (props) {
    super(props)
    this.state = {loading: false, email: '', password: ''}
    this.clickHandler = () => {
      this.setState({loading: true})
      LaundryClientSdk.createDemoLaundry().then(({email, password}) => this.setState({
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
          <use xlinkHref='#DemoMachine'/>
        </svg>
      </span>
      <form hidden ref={this.refPuller} method='post' action='/auth/local'>
        <input type='hidden' name='username' value={this.state.email}/>
        <input type='hidden' name='password' value={this.state.password}/>
      </form>
    </div>
  }
}

const Home = () => <DocumentTitle title='Home'>
  <div id='Home'>
    <header>
      <div>
        <a href='/'>
          <svg id='Logo'>
            <use xlinkHref='#Logo'/>
          </svg>
        </a>
        <h2>An easy and free booking system for your laundry.</h2>
        <div className='credit'>
          Clip by <a href='http://www.beachfrontbroll.com' target='_blank'>Beachfront</a>
        </div>
      </div>
      <div>
        <video loop='loop' autoPlay preload='meta' poster='/videos/v.png'>
          <source src='/videos/v.mp4' type='video/mp4'/>
          <source src='/videos/v.mov' type='video/mov'/>
          <source src='/videos/v.webm' type='video/webm'/>
          <source src='/videos/v.ogv' type='video/ogg'/>
        </video>
      </div>
    </header>
    <main>
      <div id='BackgroundArt'/>
      <section id='QuickStart'>
        <h1>
          Sign up your laundry in three easy steps. <br/>It's 100% free!
        </h1>
        <ul>
          <li>
            <svg className='step'>
              <use xlinkHref='#Step1'/>
            </svg>
            <div>
              <h2>Create</h2>
              Create a <a href='https://laundree.io'>Laundree</a> account using your e-mail address.<br/>
              Don’t worry, we wont spam you or anything.
            </div>
          </li>
          <li>
            <svg className='step'>
              <use xlinkHref='#Step2'/>
            </svg>
            <div>
              <h2>Register</h2>
              Register your laundry with its washing machines and dryers.<br/>
              You can register as many as you want!

            </div>
          </li>
          <li>
            <svg className='step'>
              <use xlinkHref='#Step3'/>
            </svg>
            <div>
              <h2>Invite</h2>
              Invite your tenants to use laundree.<br/>
              All you need is their e-mail addresses.
            </div>
          </li>
        </ul>
      </section>
      <section id='StartDemo'>
        <h1>
          ... or spin up a live demo before you decide.
        </h1>
        <DemoButton/>
      </section>
    </main>
  </div>
</DocumentTitle>

module.exports = Home
