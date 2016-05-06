/**
 * Created by budde on 28/04/16.
 */
var mongoose = require('mongoose')
var UserHandler = require('../handlers').UserHandler
var _ = require('lodash')
var faker = require('faker')

function clearDb () {
  return new Promise((resolve, reject) => {
    mongoose.connection.db.dropDatabase((err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function generateProfile () {
  var name = {
    familyName: faker.name.lastName(),
    middleName: faker.name.firstName(),
    givenName: faker.name.firstName()
  }
  return {
    provider: 'facebook',
    id: Math.ceil(Math.random() * 1000000),
    displayName: `${name.givenName} ${name.familyName}`,
    emails: [{value: faker.internet.email()}],
    name: name
  }
}

function populateUsers (no) {
  return Promise.all(_.range(no).map(generateProfile).map((profile) => UserHandler.createUserFromProfile(profile)))
}

module.exports.clearDb = clearDb
module.exports.populateUsers = populateUsers
