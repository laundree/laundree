/**
 * Created by budde on 05/06/16.
 */
const express = require('express')
const router = express.Router()
const React = require('react')
const {renderToString} = require('react-dom/server')
const routes = require('../../react/routes')
const {IntlProvider} = require('react-intl')
const {Provider} = require('react-redux')
const {match, RouterContext} = require('react-router')
const {createInitialStore} = require('../../redux')

router.use((req, res, next) => {
  match({routes, location: req.originalUrl}, (error, redirectLocation, renderProps) => {
    if (error) return next(error)
    if (redirectLocation) return res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    if (!renderProps) {
      const err = new Error('Not found')
      err.status = 404
      return next(error)
    }
    createInitialStore(req.user).then((store) => {
      const html = renderToString(
        <IntlProvider locale='en'>
          <Provider store={store}>
            {React.createElement(RouterContext, Object.assign({}, renderProps))}
          </Provider>
        </IntlProvider>)
      res.render('app', {layout: 'app-layout', styles: ['/stylesheets/app.css'], html: html})
    })
  })
})

module.exports = router
