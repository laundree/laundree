// @flow
import React from 'react'
import { FormattedMessage } from 'react-intl'
import SignUpUserForm from './SignUpForm'
import ContactForm from './ContactForm'
import { connect } from 'react-redux'
import type { StateAddendum } from './types'
import type { LocaleType } from '../../locales/index'

class SignUpForm extends React.Component<{ locale: LocaleType }, { choice: 'laundry' | 'user' }> {
  state = {choice: 'laundry'}

  render () {
    return (
      <div style={{backgroundColor: '#f7f7f7', color: '#595959'}}>
        <div className='signUpChooser'>
          <div
            className={this.state.choice === 'laundry' ? 'active' : ''}
            onClick={() => this.setState({choice: 'laundry'})}>
            <FormattedMessage id={'landing-page.create-laundry'} />
          </div>
          <div className={this.state.choice === 'user' ? 'active' : ''} onClick={() => this.setState({choice: 'user'})}>
            <FormattedMessage id={'landing-page.create-user'} />
          </div>
        </div>
        <div className='signUpFormContainer'>
          <FormattedMessage tagName='p' id={
            this.state.choice === 'laundry'
              ? 'landing-page.create-laundry.guide'
              : 'landing-page.create-user.guide'} />

          <SignUpUserForm createLaundry={this.state.choice === 'laundry'} />
        </div>
        <div style={{borderTop: '0.1em solid #eaeaea', color: '#aaa', padding: '1em'}}>
          <div style={{fontSize: '0.8em'}}>
            <FormattedMessage id='auth.signup.notice' values={{
              toc: <a
                style={{color: 'inherit'}}
                href={`/${this.props.locale}/terms-and-conditions`}
                target='_blank'>
                <FormattedMessage id='general.toc' />
              </a>,
              pp: <a
                style={{color: 'inherit'}}
                href={`/${this.props.locale}/privacy`} target='_blank'>
                <FormattedMessage id='general.privacy-policy' />
              </a>
            }} />
          </div>
        </div>
      </div>
    )
  }
}

const IntroSection = ({locale}: { locale: LocaleType }) => (
  <section className='intro bright'>
    <div className='container' style={{padding: 0}}>
      <div style={{overflow: 'hidden', position: 'relative', height: '38em'}}>
        <div className='title'>
          <FormattedMessage id={'landing-page.intro.title'} tagName={'h1'}/>
          <div className='desc'>
            <FormattedMessage id={'landing-page.intro.subtitle'}/>
          </div>
        </div>
        <div className='appLogos'>
          <a href='https://itunes.apple.com/us/app/laundree/id1212142663' target='_blank'>
            <img src='/images/app-ios.svg' />
          </a>
          <a href='https://play.google.com/store/apps/details?id=io.laundree' target='_blank'>
            <img src='/images/app-play.svg' />
          </a>
        </div>
        <div className='screenshot'>
          <img
            src='/images/screenshot.png'
            style={{width: '40em', position: 'absolute', top: 0}} />
        </div>
      </div>
      <div className='signUpContainer'>
        <div>
          <SignUpForm locale={locale}/>
        </div>
      </div>
    </div>
  </section>
)

const Statistics = ({userCount, bookingCount}: { userCount: number, bookingCount: number }) => (
  <section className='statistics'>
    <div className='container'>
      <div className='stat'>
        <div>
          <svg>
            <use xlinkHref='#AvatarUsers' />
          </svg>
          <span>
            {userCount}
        </span>
        </div>
        <div className='subTitle'>
          <FormattedMessage id={'landing-page.users-created'} />
        </div>
      </div>
      <div className='stat'>
        <div>
          <svg>
            <use xlinkHref='#Calendar' />
          </svg>
          <span>
            { bookingCount > 1000 ? `${Math.floor(bookingCount / 1000)}K` : bookingCount }
        </span>
        </div>
        <div className='subTitle'>
          <FormattedMessage id={'landing-page.bookings-created'} />
        </div>
      </div>
    </div>
  </section>
)

const About = () => (
  <section className='about bright' id='AboutSection'>
    <div className='container'>
      <div style={{position: 'relative'}}>
        <div className='text'>
          <FormattedMessage tagName='h2' id='about.title' />
          <FormattedMessage
            tagName='p'
            values={{nl: <br />}}
            id='about.mission.text' />
        </div>
      </div>
      <div className='imageContainer'>
        <div style={{
          boxShadow: '0 0 1em 0 #382d2d',
          border: '1em solid #03414d',
          maxWidth: '40em',
          margin: 'auto',
          position: 'relative'
        }}>
          <div style={{
            border: '0.2em solid #273133',
            position: 'relative',
            backgroundColor: '#273133',
            paddingTop: '55.74%'
          }}>
            <img src={'/images/team_cropped.jpg'} style={{
              display: 'block',
              position: 'absolute',
              top: 0,
              width: '100%'
            }} />
          </div>
        </div>
        <div style={{textAlign: 'center', fontStyle: 'italic', padding: '1em  0'}}>
          <FormattedMessage id='about.image.title' />
        </div>
      </div>
    </div>
  </section>
)

const Contact = () => (
  <section className='contact' id='ContactSection'>
    <div className='container' style={{padding: 0}}>
      <div style={{position: 'relative'}}>
        <div className='text'>
          <FormattedMessage tagName='h2' id='contact.title' />
          <FormattedMessage
            tagName='p'
            values={{nl: <br />}}
            id='contact.message' />
        </div>
      </div>
      <div className='contactForm'>
        <ContactForm />
      </div>
    </div>
  </section>
)

const Footer = () => (
  <footer style={{paddingTop: '5em', height: '20em'}}>
    <div style={{
      backgroundImage: 'url(/images/socksbg.svg)',
      backgroundSize: '10em',
      backgroundPosition: 'center',
      backgroundColor: '#e5944d',
      height: '19.6em',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTop: '0.4em solid #dd8c4d'
    }}>
      <div style={{textAlign: 'center', width: '20em', margin: 'auto', padding: '4em 0 0 0', color: '#fff'}}>
        <svg style={{fill: '#fff', height: '3em', width: '12em'}}>
          <use xlinkHref={'#WhiteLogo'} />
        </svg>
        <p style={{padding: '0.5em 0 1em 0'}}>
          <FormattedMessage id='landing-page.footer.site' />
        </p>
        <div style={{padding: '2em 0'}}>
          <a href='https://github.com/laundree' style={{padding: '0 1em', display: 'inline-block'}} target='_blank'>
            <svg style={{width: '2em', height: '2em', fill: '#fff'}}>
              <use xlinkHref='#GitHub' />
            </svg>
          </a>
          <a
            href='https://www.facebook.com/laundree.io' style={{padding: '0 1em', display: 'inline-block'}}
            target='_blank'>
            <svg style={{width: '2em', height: '2em', fill: '#fff'}}>
              <use xlinkHref='#Facebook' />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
)
type LandingPageProps = { userCount: number, bookingCount: number, locale: LocaleType }

const LandingPage = (p: LandingPageProps) => (
  <main id='LandingPage'>
    <IntroSection locale={p.locale} />
    <Statistics {...p} />
    <About />
    <Contact />
    <Footer />
  </main>
)

export default connect(({config: {statistics, locale}}: StateAddendum): LandingPageProps => ({
  ...statistics,
  locale
}))(LandingPage)
