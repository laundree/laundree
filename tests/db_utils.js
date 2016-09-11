/**
 * Created by budde on 28/04/16.
 */
const mongoose = require('mongoose')
const UserHandler = require('../handlers').UserHandler
const faker = require('faker')
const {range} = require('../utils/array')
const Promise = require('promise')

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
  return Promise.all(range(no).map(generateProfile).map((profile) => UserHandler.createUserFromProfile(profile)))
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

function populateBookings (no, {length = 3600, space = 20, offset = 0} = {}) {
  return populateMachines(1)
    .then(({user, token, laundry, machine}) =>
      Promise
        .all(range(no).map((i) => machine.createBooking(user, new Date(offset + (i * (length + space))), new Date(i * (length + space) + length + offset))))
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
  populateInvites
}
