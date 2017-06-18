// @flow
import express from 'express'
import Debug from 'debug'
import ical from 'ical-generator'
import config from 'config'
import UserHandler from '../handlers/user'
import type {Request} from '../types'
const debug = Debug('laundree.routes.calendar')
const router = express.Router()

router.get('/', (req: Request, res, next) => {
  debug('Starting to create calendar link')
  if (!req.user) {
    debug('User not found, aborting')
    return next()
  }
  const user : UserHandler = req.user
  user
    .generateCalendarToken()
    .then(token => {
      debug('Generated calendar token, redirecting')
      res.redirect(`webcal://${config.get('web.host')}${req.baseUrl}/${user.model.id}/${token.secret}/calendar.ics`)
    })
    .catch(next)
})

router.get('/:userId/:calendarToken/calendar.ics', (req: Request, res, next) => {
  const {calendarToken, userId} = req.params
  debug('Starting calendar export', calendarToken)
  UserHandler
    .lib
    .findFromId(userId)
    .then(user => {
      if (!user) {
        debug('Could not find user, aborting')
        return next()
      }
      return user
        .verifyCalendarToken(calendarToken)
        .then(result => {
          if (!result) {
            debug('Could not verify token, aborting')
            return next()
          }
          return user
            .generateEvents()
            .then(events => {
              const cal = ical(config.get('calendar'))
              cal.events(events)
              cal.serve(res)
            })
        })
    })
    .catch(next)
})

export default router

