// @flow
import express from 'express'
import Debug from 'debug'
import ical from 'ical-generator'
import config from 'config'
import UserHandler from '../handlers/user'
import type { Request } from '../types'
import type { EventOption as CalEvent } from 'ical-generator'

const debug = Debug('laundree.routes.calendar')
const router = express.Router()

router.get('/', (req: Request, res, next) => {
  debug('Starting to create calendar link')
  if (!req.user) {
    debug('User not found, aborting')
    return next()
  }
  const user: UserHandler = req.user
  user
    .generateCalendarToken()
    .then(token => {
      debug('Generated calendar token, redirecting')
      res.redirect(`webcal://${config.get('web.host')}${req.baseUrl}/${user.model.id}/${token.secret}/calendar.ics`)
    })
    .catch(next)
})

router.get('/:userId/:calendarToken/calendar.ics', async (req: Request, res, next) => {
  const {calendarToken, userId} = req.params
  debug('Starting calendar export', calendarToken)
  try {
    const user = await UserHandler
      .lib
      .findFromId(userId)

    if (!user) {
      debug('Could not find user, aborting')
      return next()
    }
    const result = await user
      .verifyCalendarToken(calendarToken)
    if (!result) {
      debug('Could not verify token, aborting')
      return next()
    }
    const events: CalEvent[] = await user.generateEvents()
    const cal = ical(config.get('calendar'))
    cal.events(events)
    cal.serve(res)
  } catch (err) {
    next(err)
  }
})

export default router

