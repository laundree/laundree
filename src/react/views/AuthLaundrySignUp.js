// @flow

import { DocumentTitle } from './intl/index'
import * as React from 'react'
import { FormattedMessage } from 'react-intl'
import type { Match, Location } from 'react-router'
import qs from 'querystring'
import SignUpForm from './SignUpForm'
import SocialButton from './SocialButton'
import { Link } from 'react-router-dom'
import { signUpStore } from '../../client/store'

export default ({match, location}: { match: Match, location: Location }) => {
  const {laundryId, key} = match.params
  if (!laundryId || !key) {
    return null
  }
  const {laundryName} = qs.parse(location.search && location.search.substr(1))
  return (
    <DocumentTitle title='document-title.signup'>
      <div>
        {laundryName
          ? (
            <FormattedMessage tagName='h1' id='auth.laundry.signup.title' values={{
              laundryName: <i>{laundryName}</i>
            }} />
          )
          : (
            <FormattedMessage tagName='h1' id='auth.laundry.signup.title.short' />
          )
        }
        <div className='auth_alternatives'>
          <SocialButton signUp type={'facebook'} qs={{mode: 'laundry', laundryId, key}} />
          <SocialButton signUp type={'google'} qs={{mode: 'laundry', laundryId, key}} />
        </div>
        <div className='or'>
          <FormattedMessage id='general.or' />
        </div>
        <SignUpForm onSignUp={({id: userId}) => signUpStore.set({userId, laundryId, key})} />
        <div className='forgot'>
          <div>
            <FormattedMessage
              id='auth.links.login'
              values={{
                link: (
                  <Link to={`/auth/laundries/${laundryId}/${key}/login${location.search}`}>
                    <FormattedMessage id='auth.links.login.link' />
                  </Link>)
              }} />
          </div>
        </div>
        <div className='notice'>
          <FormattedMessage id='auth.signup.notice' values={{
            toc: <a
              href={'/terms-and-conditions'}
              target='_blank'>
              <FormattedMessage id='general.toc' />
            </a>,
            pp: <a href={'/privacy'} target='_blank'>
              <FormattedMessage id='general.privacy-policy' />
            </a>
          }} />
        </div>
      </div>
    </DocumentTitle>
  )
}
