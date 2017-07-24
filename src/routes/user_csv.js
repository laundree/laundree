// @flow
import express from 'express'
import UserHandler from '../handlers/user'
import csv from 'csv'
import type {Request} from '../types'

const router = express.Router()

router.get('/users.csv', async (req: Request, res, next) => {
  if (!req.user || !req.user.isAdmin()) return next()
  res.set('Content-Type', 'text/csv')
  const users = await UserHandler.lib.find()
  const data = users
    .map(u => u.model.emails
      .map(email => ([
        email,
        u.model.name.familyName || '',
        u.model.name.givenName || '',
        u.model.name.middleName || '',
        u.model.displayName
      ])))
    .reduce((arr, a) => arr.concat(a), [])
  csv.stringify([['email', 'familyName', 'givenName', 'middleName', 'displayName'], ...data], {delimiter: ';'}, (err, data) => {
    if (err) {
      return next(err)
    }
    res.send(data)
  })
})

export default router

