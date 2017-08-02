// @flow
import connectMongoose from '../db/mongoose'
import { opbeat, trackRelease } from '../opbeat'
import path from 'path'
import YAML from 'yamljs'
import swaggerTools from 'swagger-tools'
import { StatusError } from '../utils/error'
import express from 'express'
import type { Application, Request } from './types'
import Debug from 'debug'
import { verify } from '../auth'
import UserHandler from '../handlers/user'
import {handleError} from './helper'

connectMongoose()
const debug = Debug('laundree:api.app')

const app: Application = express()

async function jwt (req, authOrSecDef, scopesOrApiKey, callback) {
  const authHeader = req.header('authorization')
  const match = authHeader && authHeader.match(/^Bearer (.+)$/)
  const token = match && match[1]
  debug('Verifying token %s', token)
  if (!token) {
    callback(new StatusError('Token not found', 401))
    return
  }
  try {
    const data = await verify(token, {audience: 'https://api.laundree.io'})
    debug('Decoded successfully', data)
    req.userId = data.userId
    req.subject = data.sub
    callback()
  } catch (err) {
    debug('Failed verification with error  %s', err)
    callback(new StatusError('Invalid token', 401))
  }
}

async function basic (req, authOrSecDef, scopesOrApiKey, callback) {
  const authHeader = req.header('authorization')
  const match = authHeader && authHeader.match(/^Basic (.+)$/)
  const token = match && match[1]
  debug('Verifying token %s', token)
  if (!token) {
    callback(new StatusError('Token not found', 401))
    return
  }
  const data = Buffer.from(token, 'base64').toString().split(':')
  if (data.length < 2) {
    throw new StatusError('Invalid token', 401)
  }
  const username = data[0]
  const password = data.slice(1).join(':')
  const user = await UserHandler.lib.findFromId(username)
  if (!user) {
    throw new StatusError('Invalid token', 401)
  }
  const [validToken, validPassword] = await Promise.all([user.verifyAuthToken(password), user.verifyPassword(password)])
  if (!validToken && !validPassword) {
    throw new StatusError('Invalid token', 401)
  }
  debug('Decoded successfully')
  req.userId = user.model.id
  req.subject = 'user'
  callback()
}

export default new Promise((resolve) => {
  YAML.load(path.join(__dirname, 'swagger', 'swagger.yaml'),
    (result) => {
      result.basePath = '/'
      swaggerTools.initializeMiddleware(result, (middleware) => {
        app.use(middleware.swaggerMetadata())
        app.use((req: Request, res, next) => {
          if (!opbeat) return next()
          if (!req.swagger || !req.swagger.apiPath) return next()
          opbeat.setTransactionName(`${req.method} ${req.swagger.apiPath}`)
          next()
        })
        app.use(middleware.swaggerSecurity({
          jwt,
          basic
        }))
        app.use(middleware.swaggerValidator({validateResponse: true}))
        app.use(middleware.swaggerRouter({controllers: path.join(__dirname, 'controllers')}))
        app.get('/', (req: Request, res, next) => {
          const err: Error = new StatusError('Not found', 404)
          next(err)
        })
        app.use((err, req: Request, res, next) => handleError(res, err))
        resolve(app)
      })
    })
})

trackRelease()
