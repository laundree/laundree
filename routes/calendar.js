const express = require('express')
const router = express.Router()
const debug = require('debug')('laundree.routes.pdf')
const ical = require('ical-generator')
const config = require('config')
const {UserHandler} = require('../handlers')

router.get('/', (req, res, next) => {
  debug('Starting to create calendar link')
  if (!req.user) {
    debug('User not found, aborting')
    return next()
  }
  req.user
    .generateCalendarToken()
    .then(token => {
      debug('Generated calendar token, redirecting')
      res.redirect(`webcal://${config.get('web.host')}${req.baseUrl}/${req.user.model.id}/${token}/calendar.ics`)
    })
    .catch(next)
})

router.get('/:userId/:calendarToken/calendar.ics', (req, res, next) => {
  const {calendarToken, userId} = req.params
  debug('Starting calendar export')
  UserHandler
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
              console.log(events)
              const cal = ical(config.get('calendar'))
              cal.events(events)
              cal.serve(res)
            })
        })
    })
    .catch(next)
})

module.exports = router
