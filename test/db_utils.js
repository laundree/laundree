/**
 * Created by budde on 28/04/16.
 */
const mongoose = require('mongoose')
const UserHandler = require('../test_target/handlers').UserHandler
const faker = require('faker')
const {range} = require('../test_target/utils/array')

function clearDb () {
  return new Promise((resolve, reject) => {
    mongoose.connection.dropDatabase(err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function generateProfile () {
  const name = {
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
  return Promise.all(range(no).map(generateProfile).map((profile) => UserHandler.createUserFromProfile(profile)))
}

function createAdministrator () {
  return populateTokens(1)
    .then(({user, token}) => {
      user.model.role = 'admin'
      return user.save().then(() => ({user, token}))
    })
}

function populateTokens (no) {
  const userPromise = populateUsers(1)
  return userPromise
    .then(([user]) =>
      Promise
        .all(range(no).map((i) => user.generateAuthToken(faker.name.findName())))
        .then((tokens) => ({user: user, tokens: tokens, token: tokens[0]})))
}

function populateLaundries (no) {
  return populateTokens(1)
    .then(({user, token}) =>
      Promise
        .all(range(no).map((i) => user.createLaundry(faker.name.findName())))
        .then((laundries) => ({user: user, token: token, laundries: laundries, laundry: laundries[0]})))
}

function populateMachines (no) {
  return populateLaundries(1)
    .then(({user, token, laundry}) =>
      Promise
        .all(range(no).map((i) => laundry.createMachine(faker.name.findName(), 'wash')))
        .then((machines) => ({
          user: user,
          token: token,
          laundry: laundry,
          machines: machines,
          machine: machines[0]
        })))
}

function fixOverflow ({year, day, month, hour, minute}) {
  const date = new Date(year, month - 1, day - 1, hour, minute)
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes()
  }
}

function populateBookings (no) {
  return populateMachines(1)
    .then(({user, token, laundry, machine}) =>
      Promise
        .all(range(no)
          .map(i => {
            const from = fixOverflow({year: 2000, day: i + 1, month: 1, hour: 0, minute: 0})
            const to = fixOverflow({year: 2000, day: i + 1, month: 1, hour: 1, minute: 30})
            return ({from, to})
          })
          .map(({
            from, to
          }) => laundry.createBooking(machine, user, from, to)))
        .then(bookings => ({
          user,
          token,
          laundry,
          machine,
          bookings,
          booking: bookings[0]
        })))
}

function createBooking (from, to) {
  return populateMachines(1)
    .then(({user, token, laundry, machine}) =>
      laundry.createBooking(machine, user, from, to)
        .then(bookings => ({
          user,
          token,
          laundry,
          machine,
          booking: bookings[0]
        })))
}

function populateInvites (no) {
  return this.populateLaundries(1)
    .then(({user, token, laundry}) =>
      Promise
        .all(range(no).map(i => laundry.inviteUserByEmail(faker.internet.email())))
        .then((invites) => invites.map(({invite}) => invite).filter(i => i))
        .then(invites => ({user, token, laundry, invites, invite: invites[0]})))
}

module.exports = {
  clearDb,
  populateUsers,
  populateLaundries,
  populateTokens,
  populateBookings,
  populateMachines,
  populateInvites,
  createBooking,
  createAdministrator
}
