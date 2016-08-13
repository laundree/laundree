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
        .then((tokens) => ({user: user, tokens: tokens, token: tokens[0]})))
}

function populateLaundries (no) {
  return populateTokens(1)
    .then(({user, token}) =>
      Promise
        .all(lodash.range(no).map((i) => user.createLaundry(faker.name.findName())))
        .then((laundries) => ({user: user, token: token, laundries: laundries, laundry: laundries[0]})))
}

function populateMachines (no) {
  return populateLaundries(1)
    .then(({user, token, laundry}) =>
      Promise
        .all(lodash.range(no).map((i) => laundry.createMachine(faker.name.findName(), 'wash')))
        .then((machines) => ({
          user: user,
          token: token,
          laundry: laundry,
          machines: machines,
          machine: machines[0]
        })))
}

function populateBookings (no, {length = 3600, space = 20, offset = 0} = {}) {
  return populateMachines(1)
    .then(({user, token, laundry, machine}) =>
      Promise
        .all(lodash.range(no).map((i) => machine.createBooking(user, new Date(offset + (i * (length + space))), new Date(i * (length + space) + length + offset))))
        .then((bookings) => ({
          offset,
          space,
          length,
          user,
          token,
          laundry,
          machine,
          bookings,
          booking: bookings[0]
        })))
}

module.exports = {
  clearDb: clearDb,
  populateUsers: populateUsers,
  populateLaundries: populateLaundries,
  populateTokens: populateTokens,
  populateBookings: populateBookings,
  populateMachines: populateMachines
}
