// @flow
import express from 'express'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { createInitialStore } from '../redux'
import * as error from '../../utils/error'
import config from 'config'
import App from '../../react/App'
import type { Request, Router } from '../types'
import type { LocaleType } from '../../locales/index'
import sdk from '../sdk'
import type { Statistics } from 'laundree-sdk/lib/sdk'
import {Helmet} from 'react-helmet'

let statsCache: ?{ stats: Statistics, ttl: number }

async function fetchStatistics (): Promise<{ userCount: number, bookingCount: number }> {
  if (statsCache && statsCache.ttl >= Date.now()) {
    return statsCache.stats
  }
  const stats = await sdk.api.statistics.fetchStatistics()
  statsCache = {stats, ttl: Date.now() + (60 * 60 * 1000)}
  return {userCount: stats.userCount, bookingCount: stats.bookingCount}
}

export default (locale: LocaleType) => {
  const router: Router = express.Router()

  router.use(async (req: Request, res, next) => {
    const user = req.user
    const successFlash = req.flash('success')
    const failureFlash = req.flash('error')
    const apiKey = req.session.token
    try {
      const stats = await fetchStatistics()
      const store = await createInitialStore(user, successFlash, failureFlash, locale, apiKey, stats)
      const context = {}
      const html = renderToString(
        <StaticRouter basename={`/${locale}`} context={context} location={req.originalUrl}>
          <App locale={locale} store={store} />
        </StaticRouter>)
      const head = Helmet.renderStatic()
      if (context.url) {
        return res.redirect(302, context.url)
      }
      if (context.statusCode === 404) {
        const err = new error.StatusError('Not found', 404)
        return next(err)
      }
      res.renderHb('app.hbs', {
        html,
        head: Object.keys(head).reduce((acc, k) => acc + head[k].toString(), ''),
        googleAnalyticsTrackingId: config.get('google.trackingId'),
        state: JSON.stringify(store.getState())
      })
    } catch (err) {
      error.logError(err)
    }
  })
  return router
}

