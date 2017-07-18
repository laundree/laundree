// @flow
import { startServer } from '../utils/server'
import app from './app'
import http from 'http'

const server = http.createServer(app)
startServer(server)
