/**
 * Created by budde on 11/06/16.
 */
const React = require('react')
const DocumentTitle = require('react-document-title')

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
      </div>
      <div>
        <video src='/videos/v13.mov' reload='auto' loop='loop' autoPlay/>
      </div>
    </header>
    <main>
      <div id='BackgroundArt'>
      </div>
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
        <div>
          <a href='#'>
            <svg className='step'>
              <use xlinkHref='#DemoMachine'/>
            </svg>
          </a>
        </div>
      </section>
    </main>
  </div>
</DocumentTitle>

module.exports = Home
