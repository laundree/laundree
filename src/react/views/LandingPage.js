// @flow
import React from 'react'
import { FormattedMessage } from 'react-intl'
import ContactForm from './ContactForm'
import { Link } from 'react-router-dom'
import type { LocaleType } from '../../locales'

const SignUpForm = ({locale}: { locale: LocaleType }) => (
  <div style={{backgroundColor: '#dddddd', color: '#595959'}}>
    <div className='signUpFormContainer' style={{
      backgroundColor: '#bababa',
      position: 'relative',
      borderBottom: '0.1em solid #898989'
    }}>
      <div style={{width: '10em'}}>
        Bruger din egendom allerede Laundree?
      </div>
      <Link to={`/${locale}/auth/sign-up`} className='button' style={{
        backgroundColor: '#939393',
        position: 'absolute',
        top: '1em',
        right: '1em'
      }}>
        Tilmeld dig
      </Link>
    </div>
    <div className='signUpFormContainer'>
      <h2
        style={{
          padding: '0.5em 0',
          fontSize: '1.2em',
          color: '#000',
          fontStyle: 'normal'
        }}
      >Opret vaskeri</h2>
      <p>
        Ønsker din egendom at bruge Laundree til at administere jeres vaskeri?
      </p>
      <form>
        <label>
          <input type='text' placeholder={'Dit navn'} />
        </label>
        <label>
          <input type='text' placeholder={'Din email-adresse'} />
        </label>
        <label>
          <input type='text' placeholder={'Kodeord'} />
        </label>
        <label>
          <input type='text' placeholder={'Gentag kodeord'} />
        </label>
        <div style={{paddingTop: '1em'}}>
          <label>
            <input type='text' placeholder={'Vaskeri navn'} />
          </label>
          <label>
            <input type='text' placeholder={'Adresse'} />
          </label>
          <div style={{fontSize: '0.9em', padding: '1em 0 0 0'}}>
            Bemærk: Ved tilmelding accepterer du vores Vilkår og betingelser samt Privatlivspolitik.
          </div>
          <div className='buttons'>
            <input type='submit' className='orange' value='Opret vaskeri' />
          </div>
        </div>
      </form>
    </div>
  </div>
)

const IntroSection = ({locale}: { locale: LocaleType }) => (
  <section className='intro bright'>
    <div className='container' style={{padding: 0}}>
      <div style={{overflow: 'hidden', position: 'relative', height: '38em'}}>
        <div className='title'>
          <h1>
            Et gratis booking system til dit fællesvaskeri
          </h1>
          <div className='desc'>
            Book vasketid ligemeget hvor du er!
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
          <SignUpForm locale={locale} />
        </div>
      </div>
    </div>
  </section>
)

const Statistics = () => (
  <section className='statistics'>
    <div className='container'>
      <div className='stat'>
        <div>
          <svg>
            <use xlinkHref='#AvatarUsers' />
          </svg>
          <span>
          300
        </span>
        </div>
        <div className='subTitle'>
          brugere er oprettet
        </div>
      </div>
      <div className='stat'>
        <div>
          <svg>
            <use xlinkHref='#Calendar' />
          </svg>
          <span>
          5172
        </span>
        </div>
        <div className='subTitle'>
          bookinger foretaget
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
    <div style={{backgroundColor: '#e5944d', height: '20em', position: 'absolute', bottom: 0, left: 0, right: 0}}>
      <div style={{textAlign: 'center', width: '20em', margin: 'auto', padding: '4em 0', color: '#fff'}}>
        <svg style={{fill: '#fff', height: '2em', width: '8em'}}>
          <use xlinkHref={'#WhiteLogo'} />
        </svg>
        <p style={{padding: '0.5em 0 1em 0'}}>
          A site by Bookrs IVS
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

export default ({locale}: { locale: LocaleType }) => (
  <main id='LandingPage'>
    <IntroSection locale={locale} />
    <Statistics />
    <About />
    <Contact />
    <Footer />
  </main>
)
