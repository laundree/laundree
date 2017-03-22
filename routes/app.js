/**
 * Created by budde on 05/06/16.
 */
const express = require('express')
const router = express.Router()
const React = require('react')
const {renderToString} = require('react-dom/server')
const {StaticRouter} = require('react-router')
const {createInitialStore} = require('../redux')
const utils = require('../utils')
const DocumentTitle = require('react-document-title')
const config = require('config')
const App = require('../react/containers/App')

router.use((req, res, next) => {
  createInitialStore(req.user, req.flash('success'), req.flash('error'), req.locale, config.get('google.clientApiKey'), req.session.returningUser)
    .then(store => {
      const context = {}
      const locale = req.locale
      const html = renderToString(<StaticRouter context={context} location={req.originalUrl}>
        <App locale={locale} store={store}/>
      </StaticRouter>)
      if (context.url) {
        return res.redirect(302, context.url)
      }
      if (context.statusCode === 404) {
        const err = new Error('Not found')
        err.status = 404
        return next(err)
      }
      const title = DocumentTitle.rewind()
      res.renderHb('app.hbs', {
        html,
        title,
        intlTitle: 'general.empty',
        state: JSON.stringify(store.getState())
      })
    })
    .catch(utils.error.logError)
})

module.exports = router
