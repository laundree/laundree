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
router.use((req, res, next) => {
  createInitialStore(req.user)
    .then((store) => {
      match({routes: routeGenerator(store), location: req.originalUrl}, (error, redirectLocation, renderProps) => {
        if (error) return next(error)
        if (redirectLocation) return res.redirect(302, redirectLocation.pathname + redirectLocation.search)
        if (!renderProps) {
          const err = new Error('Not found')
          err.status = 404
          return next(error)
        }
        const html = renderToString(
          <IntlProvider locale='en'>
            <Provider store={store}>
              {React.createElement(RouterContext, Object.assign({}, renderProps))}
            </Provider>
          </IntlProvider>)
        const title = DocumentTitle.rewind()
        res.render('app', {html: html, title: title})
      })
    })
    .catch(utils.error.logError)
})

module.exports = router
