// @flow
import connectMongoose from '../test_target/db/mongoose'
import mongoose from 'mongoose'
import UserHandler from '../test_target/handlers/user'
import faker from 'faker'
import { range } from '../test_target/utils/array'
import type TokenHandler from '../src/handlers/token'

connectMongoose()

export function clearDb (): Promise<void> {
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

export function populateUsers (no: number): Promise<UserHandler[]> {
  return Promise.all(range(no).map(generateProfile).map((profile) => UserHandler.lib.createUserFromProfile(profile)))
}

export async function createAdministrator (): Promise<{ user: UserHandler, token: TokenHandler }> {
  const {user, token} = await populateTokens(1)
  user.model.role = 'admin'
  await user.save()
  return {user, token}
}

export async function populateTokens (no: number) : Promise<{user: UserHandler, tokens: TokenHandler[], token: TokenHandler}> {
  const [user] = await populateUsers(1)
  const tokens = await Promise.all(range(no).map((i) => user.generateAuthToken(faker.name.findName())))
  return {user: user, tokens: tokens, token: tokens[0]}
}

export async function populateLaundries (no: number) {
  const {user, token} = await populateTokens(1)
  const laundries = await Promise.all(range(no).map((i) => user.createLaundry(faker.name.findName())))
  return {user: user, token: token, laundries: laundries, laundry: laundries[0]}
}

export async function populateMachines (no: number) {
  const {user, token, laundry} = await populateLaundries(1)
  const machines = await Promise
    .all(range(no).map((i) => laundry.createMachine(faker.name.findName(), 'wash')))
  return {
    user: user,
    token: token,
    laundry: laundry,
    machines: machines,
    machine: machines[0]
  }
}

export function fixOverflow ({year, day, month, hour, minute}: *) {
  const date = new Date(year, month - 1, day - 1, hour, minute)
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes()
  }
}

export async function populateBookings (no: number) {
  const {user, token, laundry, machine} = await populateMachines(1)
  const bookings = await Promise
    .all(range(no)
      .map(i => {
        const from = fixOverflow({year: 2000, day: i + 1, month: 1, hour: 0, minute: 0})
        const to = fixOverflow({year: 2000, day: i + 1, month: 1, hour: 1, minute: 30})
        return ({from, to})
      })
      .map(({from, to}) => laundry.createBooking(machine, user, from, to)))
  return {
    user,
    token,
    laundry,
    machine,
    bookings,
    booking: bookings[0]
  }
}

export async function createBooking (from: *, to: *) {
  const {user, token, laundry, machine} = await populateMachines(1)
  const bookings = await laundry.createBooking(machine, user, from, to)
  return {
    user,
    token,
    laundry,
    machine,
    booking: bookings[0]
  }
}

export async function populateInvites (no: number) {
  const {user, token, laundry} = await this.populateLaundries(1)
  const is = await Promise.all(range(no).map(i => laundry.inviteUserByEmail(faker.internet.email())))
  const invites = is.map(({invite}) => invite).filter(i => i)
  return {user, token, laundry, invites, invite: invites[0]}
}
