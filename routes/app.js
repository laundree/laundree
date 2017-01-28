/**
 * Created by budde on 05/06/16.
 */
const express = require('express')
const router = express.Router()
const React = require('react')
const {renderToString} = require('react-dom/server')
const routeGenerator = require('../react/routes')
const {IntlProvider} = require('react-intl')
const {Provider} = require('react-redux')
const {match, RouterContext} = require('react-router')
const {createInitialStore} = require('../redux')
const utils = require('../utils')
const DocumentTitle = require('react-document-title')
const {opbeat} = require('../lib/opbeat')
const locales = require('../locales')
const config = require('config')

router.use((req, res, next) => {
  createInitialStore(req.user, req.flash('success'), req.flash('error'), '', req.locale, config.get('google.clientApiKey'), req.session.returningUser)
    .then(store => {
      match({routes: routeGenerator(store), location: req.originalUrl}, (error, redirectLocation, renderProps) => {
        if (error) return next(error)
        if (redirectLocation) return res.redirect(302, redirectLocation.pathname + redirectLocation.search)
        if (!renderProps) {
          const err = new Error('Not found')
          err.status = 404
          return next(error)
        }
        if (opbeat) {
          const pattern = renderProps.routes.map(r => r.path).join('/').replace('//', '/')
          opbeat.setTransactionName(`${req.method} ${pattern}`)
        }
        const locale = store.getState().config.locale
        const html = renderToString(
          <IntlProvider locale={locale} messages={locales[locale].messages}>
            <Provider store={store}>
              {React.createElement(RouterContext, Object.assign({}, renderProps))}
            </Provider>
          </IntlProvider>)
        const title = DocumentTitle.rewind()
        res.renderHb('app.hbs', {
          html,
          title,
          intlTitle: 'general.empty',
          state: JSON.stringify(store.getState())
        })
      })
    })
    .catch(utils.error.logError)
})

module.exports = router
