// @flow
import React from 'react'
import { FormattedMessage } from 'react-intl'
import querystring from 'querystring'

export default ({qs, type, signUp}: { signUp?: boolean, qs?: { [string]: string }, type: 'facebook' | 'google' }) => {
  const q = qs
    ? '?' + querystring.stringify(qs)
    : ''
  const message = `auth.${signUp ? 'signup' : 'login'}.method.${type}`
  return (
    <a href={`/auth/${type}${q}`} className={type}>
      <svg>
        <use xlinkHref={
          type === 'facebook'
            ? '#Facebook'
            : '#GooglePlus'
        } />
      </svg>
      <FormattedMessage id={message} />
    </a>
  )
}
