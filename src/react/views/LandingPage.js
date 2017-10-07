// @flow
import React from 'react'
import { FormattedMessage } from 'react-intl'

const IntroSection = () => (
  <section className='intro bright'>
    <div className='container'>
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
  <section className='about bright'>
    <div className='container'>
      <div className='text'>
        <FormattedMessage tagName='h2' id='about.title' />
        <FormattedMessage
          tagName='p'
          values={{nl: <br />}}
          id='about.mission.text' />
      </div>
    </div>
  </section>
)

export default () => (
  <main id='LandingPage'>
    <IntroSection />
    <Statistics />
    <About />
  </main>
)
