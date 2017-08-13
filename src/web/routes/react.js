// @flow
import express from 'express'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { createInitialStore } from '../redux'
import * as error from '../../utils/error'
import DocumentTitle from 'react-document-title'
import config from 'config'
import App from '../../react/views/App'
import type { Request, Router } from '../types'

const router: Router = express.Router()

router.use((req: Request, res, next) => {
  const user = req.user
  const locale = req.locale
  const successFlash = req.flash('success')
  const failureFlash = req.flash('error')
  const apiKey = req.session.token
  createInitialStore(user, successFlash, failureFlash, locale, config.get('google.clientApiKey'), apiKey)
    .then(store => {
      const context = {}
      const html = renderToString(<StaticRouter context={context} location={req.originalUrl}>
        <App locale={locale || 'en'} store={store}/>
      </StaticRouter>)
      if (context.url) {
        return res.redirect(302, context.url)
      }
      if (context.statusCode === 404) {
        const err = new error.StatusError('Not found', 404)
        return next(err)
      }
      const title = DocumentTitle.rewind()
      res.renderHb('app.hbs', {
        html,
        title,
        googleAnalyticsTrackingId: config.get('google.trackingId'),
        intlTitle: 'general.empty',
        state: JSON.stringify(store.getState())
      })
    })
    .catch(error.logError)
})

export default router
