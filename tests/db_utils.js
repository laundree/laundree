/**
 * Created by budde on 28/04/16.
 */
var mongoose = require('mongoose')
var UserHandler = require('../handlers').UserHandler
var lodash = require('lodash')
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
  return Promise.all(lodash.range(no).map(generateProfile).map((profile) => UserHandler.createUserFromProfile(profile)))
}

function populateTokens (no) {
  const userPromise = populateUsers(1)
  return userPromise
    .then(([user]) =>
      Promise
        .all(lodash.range(no).map((i) => user.generateAuthToken(faker.name.findName())))
        .then((tokens) => ({user: user, tokens: tokens})))
}

function populateLaundries (no) {
  return populateTokens(1)
    .then(({user, tokens}) =>
      Promise
        .all(lodash.range(no).map((i) => user.createLaundry(faker.name.findName())))
        .then((laundries) => ({user: user, token: tokens[0], laundries: laundries})))
}

module.exports = {
  clearDb: clearDb,
  populateUsers: populateUsers,
  populateLaundries: populateLaundries,
  populateTokens: populateTokens
}
