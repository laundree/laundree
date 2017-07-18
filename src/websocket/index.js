// @flow
import http from 'http'
import {startServer} from '../utils/server'
import setupSocket from './socket_io'

const server = http.createServer()
startServer(server)
setupSocket(server)
