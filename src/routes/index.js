// @flow

import express from 'express'
import path from 'path'
import config from 'config'
import setupSass from 'node-sass-middleware'
import cors from 'cors'
import identicon from './identicon'
import logout from './logout'
import auth from './auth'
import calendar from './calendar'
import inviteCode from './invite-code'
import lang from './lang'
import app from './app'
import webpack from './webpack'
import {fetchRouter} from './swagger'

export function fetchPseudoStaticRoutes () {
  const router = express.Router()
  router.use('/identicon', identicon)
  router.use(setupSass({
    src: path.join(__dirname, '..', '..', 'stylesheets'),
    dest: path.join(__dirname, '..', '..', 'dist', 'stylesheets'),
    prefix: '/stylesheets',
    outputStyle: config.get('sass.outputStyle'),
    indentedSyntax: true,
    sourceMap: true
  }))
  router.use(webpack)
  return router
}

export function fetchRoutes () {
  const router = express.Router()
  router.use('/logout', logout)
  router.use('/auth', auth)
  router.use('/calendar', calendar)
  router.use('/s', inviteCode)
  router.use('/lang', lang)
  return fetchRouter().then(route => {
    router.use('/api', cors(), route)
    router.use('/', app)
    return router
  })
}

