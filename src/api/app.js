// @flow
import connectMongoose from '../db/mongoose'
import { opbeat, trackRelease } from '../opbeat'
import path from 'path'
import YAML from 'yamljs'
import swaggerTools from 'swagger-tools'
import { logError, StatusError } from '../utils/error'
import express from 'express'
import type { Application, Request } from './types'
import Debug from 'debug'
import {verify} from '../auth'

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
    const data = await verify(token, 'https://api.laundree.io')
    debug('Decoded successfully', data)
    callback()
  } catch (err) {
    debug('Failed verification with error  %s', err)
    callback(new StatusError('Invalid token', 401))
  }
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
          jwt
        }))
        app.use(middleware.swaggerValidator({validateResponse: true}))
        app.use(middleware.swaggerRouter({controllers: path.join(__dirname, 'controllers')}))
        app.get('/', (req: Request, res, next) => {
          const err: Error = new StatusError('Not found', 404)
          next(err)
        })
        app.use((err, req: Request, res, next) => {
          const status = (typeof err.status === 'number' && err.status) || 500
          res.status(status)
          if (status !== 500) {
            res.json({message: err.message})
            return
          }
          logError(err)
          res.json({message: 'Internal server error'})
        })
        resolve(app)
      })
    })
})

trackRelease()
