// @flow
import http from 'http'
import { startServer } from '../utils/server'
import setupSocket from './socket_io'
import express from 'express'
import type { Request } from 'express'

const app = express()

app.get('/', (req: Request<*, *>, res) => {
  res.send('OK')
})

const server = http.createServer(app)
startServer(server)
setupSocket(server)
